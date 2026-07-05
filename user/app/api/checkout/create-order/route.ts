import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import Razorpay from "razorpay"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { createShipment, checkPincodeServiceability } from "@/lib/fship/actions"
import { computeDiscount, type CouponLike } from "@/lib/actions/coupon"
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation"
import { sendAdminOrderNotification } from "@/lib/emails/admin-notification"
import { createOrderSchema, validateRequest, type CreateOrderInput } from "@/lib/validations/api"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const CHECKOUT_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60000,
}

function getRazorpay(): Razorpay {
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured")
  }
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimitResult = await checkRateLimit(`checkout:${clientIp}`, CHECKOUT_RATE_LIMIT)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          message: "Too many checkout attempts. Please try again later.",
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateLimitResult.resetIn / 1000).toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    const session = await auth()
    const sessionUserId = session?.user?.id ?? null

    let validatedBody: CreateOrderInput
    try {
      const rawBody = await request.json()
      validatedBody = validateRequest(createOrderSchema, rawBody)
    } catch (validationError) {
      return NextResponse.json(
        { message: validationError instanceof Error ? validationError.message : "Invalid request data" },
        { status: 400 }
      )
    }

    const {
      items,
      subtotal,
      shippingCost = 0,
      estimatedDays,
      shippingAddress,
      email,
      discountCode,
      paymentMethod = "prepaid",
      userId: bodyUserId,
      walletAmountUsed,
    } = validatedBody

    const userId = sessionUserId ?? bodyUserId ?? null

    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: "Cart is empty" },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Block COD if disabled in admin settings
    if (paymentMethod === "cod") {
      const codSetting = await db.collection("admin_settings").findOne({ key: "cod_enabled" })
      if (codSetting?.value === false) {
        return NextResponse.json(
          { message: "Cash on Delivery is currently not available" },
          { status: 400 }
        )
      }
    }

    // ========================================================================
    // Cleanup expired checkout sessions + any legacy stale pending orders
    // ========================================================================

    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000)
    try {
      await db.collection("checkout_sessions").deleteMany({
        created_at: { $lt: staleThreshold },
      })

      // Clean up any legacy pending orders from before this refactor
      const staleOrders = await db.collection("orders")
        .find({ status: "pending", created_at: { $lt: staleThreshold } })
        .project({ _id: 1, discount_code_id: 1 })
        .toArray()

      if (staleOrders.length > 0) {
        const staleIds = staleOrders.map((o) => o._id)
        await db.collection("order_items").deleteMany({ order_id: { $in: staleIds } })
        await db.collection("order_status_history").deleteMany({ order_id: { $in: staleIds } })
        await db.collection("orders").deleteMany({ _id: { $in: staleIds } })

        for (const order of staleOrders) {
          if (order.discount_code_id) {
            await db.collection("coupons").updateOne(
              { _id: new ObjectId(order.discount_code_id) },
              { $inc: { usage_count: -1 } }
            )
          }
        }
      }
    } catch (cleanupError) {
      console.error("Cleanup error (non-fatal):", cleanupError)
    }

    // ========================================================================
    // Stock Availability Check
    // ========================================================================

    // Batch stock check — fetch all variant IDs in one query
    const variantIds = items.filter(i => i.variantId && ObjectId.isValid(i.variantId)).map(i => new ObjectId(i.variantId!))
    const productIdsWithoutVariant = items.filter(i => !i.variantId && i.productId).map(i => new ObjectId(i.productId))

    const [variantDocs, productVariantDocs] = await Promise.all([
      variantIds.length > 0
        ? db.collection("product_variants").find({ _id: { $in: variantIds } }).toArray()
        : Promise.resolve([]),
      productIdsWithoutVariant.length > 0
        ? db.collection("product_variants").find({ product_id: { $in: productIdsWithoutVariant } }).toArray()
        : Promise.resolve([]),
    ])

    const variantMap = new Map(variantDocs.map(v => [v._id.toString(), v]))
    const productVariantMap = new Map<string, number>()
    for (const v of productVariantDocs) {
      const pid = v.product_id.toString()
      productVariantMap.set(pid, (productVariantMap.get(pid) ?? 0) + (v.stock_quantity ?? 0))
    }

    const outOfStockItems: string[] = []
    for (const item of items) {
      let stockQuantity = 0

      if (item.variantId) {
        const variant = variantMap.get(item.variantId)
        stockQuantity = variant?.stock_quantity ?? 0
      } else if (item.productId) {
        stockQuantity = productVariantMap.get(item.productId) ?? 0
      }

      if (stockQuantity < item.quantity) {
        outOfStockItems.push(
          `${item.name}${item.variantName ? ` (${item.variantName})` : ""}: only ${stockQuantity} available`
        )
      }
    }

    if (outOfStockItems.length > 0) {
      return NextResponse.json(
        { message: "Some items are out of stock", outOfStockItems },
        { status: 400 }
      )
    }

    // ========================================================================
    // Server-side Price Authority
    // ========================================================================
    // NEVER trust client item.price. Resolve the authoritative price for every
    // item server-side and MUTATE item.price so all downstream computations
    // (subtotal, discount, order items, emails, shipment) use the trusted value.

    // Fetch products (for base_price fallback) + build a default-variant price
    // map for productId-only items.
    const productDocs = productIdsWithoutVariant.length > 0
      ? await db.collection("products").find({ _id: { $in: productIdsWithoutVariant } }).toArray()
      : []
    const productBasePriceMap = new Map<string, number>()
    for (const p of productDocs) productBasePriceMap.set(p._id.toString(), Number(p.base_price))

    const productVariantPriceMap = new Map<string, number>()
    for (const v of productVariantDocs) {
      const pid = v.product_id.toString()
      if (!productVariantPriceMap.has(pid)) productVariantPriceMap.set(pid, Number(v.price))
    }

    for (const item of items) {
      let resolvedPrice: number | null = null

      if (item.variantId) {
        const variant = variantMap.get(item.variantId)
        if (!variant) {
          return NextResponse.json(
            { message: `Item unavailable: ${item.name}. Please refresh your cart.` },
            { status: 400 }
          )
        }
        resolvedPrice = Number(variant.price)
      } else if (item.productId) {
        resolvedPrice =
          productVariantPriceMap.get(item.productId) ??
          productBasePriceMap.get(item.productId) ??
          null
      }

      if (resolvedPrice === null || !Number.isFinite(resolvedPrice) || resolvedPrice <= 0) {
        return NextResponse.json(
          { message: `Could not verify price for ${item.name}. Please refresh your cart.` },
          { status: 400 }
        )
      }

      // Trust the server price from here on.
      item.price = resolvedPrice
    }

    // Recalculate subtotal from server-authoritative prices
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // ========================================================================
    // Discount Calculation
    // ========================================================================

    let discount = 0
    let discountCodeId: string | null = null

    if (discountCode) {
      const now = new Date()

      // Atomically validate coupon and increment usage in one operation
      // This prevents race conditions where two concurrent orders could both pass the usage limit check
      const couponResult = await db.collection("coupons").findOneAndUpdate(
        {
          code: discountCode.toUpperCase(),
          is_active: true,
          $or: [
            { valid_from: { $exists: false } },
            { valid_from: null },
            { valid_from: { $lte: now } },
          ],
          $and: [
            {
              $or: [
                { valid_until: { $exists: false } },
                { valid_until: null },
                { valid_until: { $gte: now } },
              ],
            },
          ],
          $expr: {
            $or: [
              // No usage limit set
              {
                $and: [
                  { $eq: [{ $ifNull: ["$usage_limit", null] }, null] },
                  { $eq: [{ $ifNull: ["$max_uses", null] }, null] },
                ],
              },
              // usage_count < usage_limit or max_uses
              {
                $lt: [
                  { $ifNull: ["$usage_count", { $ifNull: ["$current_uses", 0] }] },
                  { $ifNull: ["$usage_limit", { $ifNull: ["$max_uses", Infinity] }] },
                ],
              },
            ],
          },
        },
        { $inc: { usage_count: 1 } },
        { returnDocument: "before" }
      )

      const code = couponResult
      if (code) {
        const minOrder = code.min_order_amount ?? 0

        // Shared discount computation — caps fixed discounts at subtotal and
        // rounds to 2 decimals, exactly matching validateCoupon (the UI).
        const cartItemsForDiscount = items.map((item) => ({
          price: item.price,
          quantity: item.quantity,
        }))
        const computed =
          calculatedSubtotal >= minOrder
            ? await computeDiscount(code as CouponLike, calculatedSubtotal, cartItemsForDiscount)
            : 0

        if (computed > 0) {
          discount = computed
          discountCodeId = code._id.toString()
        } else {
          // Min order not met, buy-x-get-y qty not reached, or zero discount —
          // roll back the usage increment we reserved above.
          await db.collection("coupons").updateOne(
            { _id: code._id },
            { $inc: { usage_count: -1 } }
          )
        }
      }
    }

    // ========================================================================
    // Total Calculation
    // ========================================================================

    // Server-authoritative shipping — NEVER trust client shippingCost (display
    // only). Resolve delivery-fee settings from admin_settings, then apply the
    // canonical shipping resolution: delivery fee off => free; else free over
    // the threshold; otherwise recompute from pincode.
    const deliveryEnabledSetting = await db.collection("admin_settings").findOne({ key: "delivery_fee_enabled" })
    const deliveryThresholdSetting = await db.collection("admin_settings").findOne({ key: "free_delivery_threshold" })
    const deliveryFeeEnabled = deliveryEnabledSetting?.value !== false
    const thresholdValue = deliveryThresholdSetting?.value
    const freeDeliveryThreshold =
      typeof thresholdValue === "number" && isFinite(thresholdValue) ? thresholdValue : 999

    let shipping = 0
    if (!deliveryFeeEnabled) {
      shipping = 0
    } else if (calculatedSubtotal >= freeDeliveryThreshold) {
      shipping = 0
    } else {
      try {
        const serviceability = await checkPincodeServiceability(shippingAddress.pincode)
        shipping = serviceability.success && serviceability.data
          ? serviceability.data.shippingCost
          : (shippingCost ?? 0)
      } catch {
        shipping = shippingCost ?? 0
      }
    }

    const preWalletTotal = Math.max(0, calculatedSubtotal - discount + shipping)

    // Wallet — re-validate against the user's ACTUAL balance server-side, cap it
    // to both the balance and the amount due. Only applied for prepaid (debited
    // atomically at payment confirmation); ignored for COD.
    let walletApplied = 0
    if (paymentMethod === "prepaid" && walletAmountUsed && walletAmountUsed > 0 && userId) {
      const walletUserIds: (string | ObjectId)[] = [userId]
      if (typeof userId === "string" && ObjectId.isValid(userId)) {
        walletUserIds.push(new ObjectId(userId))
      }
      const wallet = await db.collection("wallets").findOne({ user_id: { $in: walletUserIds } })
      const balance = Number(wallet?.balance) || 0
      walletApplied = Math.max(0, Math.min(walletAmountUsed, balance, preWalletTotal))
      walletApplied = Math.round(walletApplied * 100) / 100
    }

    const total = Math.max(0, preWalletTotal - walletApplied)

    // ========================================================================
    // Razorpay Order (Prepaid Only)
    // ========================================================================

    let razorpayOrderId = null
    let amountInPaise = 0

    if (paymentMethod === "prepaid") {
      amountInPaise = Math.round(total * 100)
      const razorpay = getRazorpay()
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: `order_${Date.now()}`,
        })
        razorpayOrderId = razorpayOrder.id
      } catch (razorpayError) {
        // Prevent coupon usage leak: release the slot we reserved above.
        if (discountCodeId) {
          await db.collection("coupons").updateOne(
            { _id: new ObjectId(discountCodeId) },
            { $inc: { usage_count: -1 } }
          )
        }
        throw razorpayError
      }
    }

    // ========================================================================
    // Prepaid: Store checkout session (NO order in DB until payment confirmed)
    // ========================================================================

    if (paymentMethod === "prepaid") {
      // Roll back coupon usage — will re-increment on payment confirmation
      if (discountCodeId) {
        await db.collection("coupons").updateOne(
          { _id: new ObjectId(discountCodeId) },
          { $inc: { usage_count: -1 } }
        )
      }

      const sessionDoc = {
        user_id: userId && ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
        email,
        items,
        subtotal: calculatedSubtotal,
        discount_amount: discount,
        discount_code: discountCode || null,
        discount_code_id: discountCodeId,
        shipping_amount: shipping,
        shipping_cost: shipping,
        total,
        shipping_address: shippingAddress,
        razorpay_order_id: razorpayOrderId,
        wallet_amount_used: walletApplied,
        estimated_delivery_days: estimatedDays || null,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000),
      }

      const sessionResult = await db.collection("checkout_sessions").insertOne(sessionDoc)

      return NextResponse.json({
        sessionId: sessionResult.insertedId.toString(),
        razorpayOrderId,
        amount: amountInPaise,
        currency: "INR",
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        paymentMethod: "prepaid",
      })
    }

    // ========================================================================
    // COD: Create order immediately
    // ========================================================================

    const orderDoc = {
      user_id: userId && ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
      email,
      order_number: `AL-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      subtotal: calculatedSubtotal,
      discount_amount: discount,
      discount_code_id: discountCodeId,
      shipping_amount: shipping,
      shipping_cost: shipping,
      total,
      shipping_address: shippingAddress,
      razorpay_order_id: null,
      wallet_amount_used: walletApplied,
      estimated_delivery_days: estimatedDays || null,
      payment_method: paymentMethod,
      status: "confirmed",
      created_at: new Date(),
      updated_at: new Date(),
    }

    const orderResult = await db.collection("orders").insertOne(orderDoc)
    const orderId = orderResult.insertedId.toString()
    const orderNumber = orderDoc.order_number

    const orderItems = items.map((item) => ({
      order_id: orderResult.insertedId,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      product_name: item.name,
      variant_name: item.variantName ?? null,
      price: item.price,
      price_at_purchase: item.price,
      quantity: item.quantity,
      image_url: item.image ?? null,
      created_at: new Date(),
    }))

    await db.collection("order_items").insertMany(orderItems)

    // COD Order Processing
    {
      await db.collection("order_status_history").insertOne({
        order_id: orderResult.insertedId,
        status: "confirmed",
        note: "Cash on Delivery order placed",
        created_at: new Date(),
      })

      // Decrease stock atomically with rollback on failure
      const deductedItems: { variantId?: string; productId?: string; quantity: number }[] = []
      let stockDeductionFailed = false

      for (const item of items) {
        if (item.variantId && ObjectId.isValid(item.variantId)) {
          const result = await db.collection("product_variants").updateOne(
            { _id: new ObjectId(item.variantId), stock_quantity: { $gte: item.quantity } },
            { $inc: { stock_quantity: -item.quantity } }
          )
          if (result.modifiedCount === 0) {
            console.error(`Stock insufficient for variant ${item.variantId}`)
            stockDeductionFailed = true
            break
          }
          deductedItems.push({ variantId: item.variantId, quantity: item.quantity })
        } else if (item.productId) {
          const result = await db.collection("product_variants").updateOne(
            { product_id: new ObjectId(item.productId), stock_quantity: { $gte: item.quantity } },
            { $inc: { stock_quantity: -item.quantity } }
          )
          if (result.modifiedCount === 0) {
            console.error(`Stock insufficient for product ${item.productId}`)
            stockDeductionFailed = true
            break
          }
          deductedItems.push({ productId: item.productId, quantity: item.quantity })
        }
      }

      // Rollback on stock deduction failure: restore already-deducted stock and delete order
      if (stockDeductionFailed) {
        for (const deducted of deductedItems) {
          if (deducted.variantId) {
            await db.collection("product_variants").updateOne(
              { _id: new ObjectId(deducted.variantId) },
              { $inc: { stock_quantity: deducted.quantity } }
            )
          } else if (deducted.productId) {
            await db.collection("product_variants").updateOne(
              { product_id: new ObjectId(deducted.productId) },
              { $inc: { stock_quantity: deducted.quantity } }
            )
          }
        }

        // Delete the order and its items
        await db.collection("order_items").deleteMany({ order_id: orderResult.insertedId })
        await db.collection("order_status_history").deleteMany({ order_id: orderResult.insertedId })
        await db.collection("orders").deleteOne({ _id: orderResult.insertedId })

        // Roll back coupon usage if it was incremented
        if (discountCodeId) {
          await db.collection("coupons").updateOne(
            { _id: new ObjectId(discountCodeId) },
            { $inc: { usage_count: -1 } }
          )
        }

        return NextResponse.json(
          { message: "Some items went out of stock. Please refresh your cart and try again." },
          { status: 409 }
        )
      }

      // Send confirmation email (non-blocking)
      try {
        await sendOrderConfirmationEmail({
          orderId,
          orderNumber,
          customerName: shippingAddress.full_name,
          customerEmail: email,
          items: items.map((item) => ({
            product_name: item.name,
            variant_name: item.variantName,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: calculatedSubtotal,
          discount,
          shipping,
          walletUsed: 0,
          total,
          shippingAddress,
          paymentMethod: "Cash on Delivery",
        })
      } catch (emailError) {
        console.error("Order confirmation email failed (non-fatal):", emailError)
      }

      // Admin notification email (non-blocking)
      try {
        await sendAdminOrderNotification({
          orderId,
          orderNumber,
          customerName: shippingAddress.full_name,
          customerEmail: email,
          customerPhone: shippingAddress.phone,
          items: items.map((item) => ({
            product_name: item.name,
            variant_name: item.variantName,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: calculatedSubtotal,
          discount,
          shipping,
          total,
          paymentMethod: "Cash on Delivery",
          shippingAddress,
        })
      } catch (adminEmailError) {
        console.error("Admin notification email failed (non-fatal):", adminEmailError)
      }

      // Create FShip shipment via createShipment (also registers pickup).
      // Non-blocking: on failure we record shipment_error but never fail the order.
      try {
        const totalQty = items.reduce((sum, item) => sum + item.quantity, 0)
        const shipmentWeight = 0.5 * totalQty
        const shipmentResult = await createShipment({
          orderId: orderNumber,
          consigneeName: shippingAddress.full_name,
          consigneeAddress1: shippingAddress.line1,
          consigneeAddress2: shippingAddress.line2,
          consigneePincode: shippingAddress.pincode,
          consigneeMobile: shippingAddress.phone,
          consigneeEmail: email,
          consigneeCity: shippingAddress.city || "",
          weight: shipmentWeight,
          declaredValue: total,
          pickupDate: new Date().toISOString().split("T")[0],
          pickupTime: "14:00",
          paymentMode: "cod",
          codAmount: total,
          products: items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            sku: item.variantId ? (variantMap.get(item.variantId)?.sku ?? undefined) : undefined,
          })),
        })

        if (shipmentResult.success && shipmentResult.awbNumber) {
          await db.collection("orders").updateOne(
            { _id: orderResult.insertedId },
            {
              $set: {
                awb_number: shipmentResult.awbNumber,
                courier_name: "FShip",
                fship_order_id: shipmentResult.apiOrderId ?? null,
                fship_label_url: shipmentResult.labelUrl ?? null,
                fship_routing_code: shipmentResult.routingCode ?? null,
                pickup_order_id: shipmentResult.pickupOrderId ?? null,
              },
            }
          )
        } else {
          await db.collection("orders").updateOne(
            { _id: orderResult.insertedId },
            { $set: { shipment_error: shipmentResult.error || "Shipment creation failed" } }
          )
        }
      } catch (shippingError) {
        console.error("FShip shipment creation error (non-fatal):", shippingError)
        await db.collection("orders").updateOne(
          { _id: orderResult.insertedId },
          {
            $set: {
              shipment_error:
                shippingError instanceof Error ? shippingError.message : "Shipment creation failed",
            },
          }
        )
      }

      return NextResponse.json({
        orderId,
        orderNumber,
        paymentMethod: "cod",
        success: true,
      })
    }
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
