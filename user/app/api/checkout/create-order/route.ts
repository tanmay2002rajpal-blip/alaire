import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import Razorpay from "razorpay"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { blueDartClient } from "@/lib/bluedart/client"
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
    const rateLimitResult = checkRateLimit(`checkout:${clientIp}`, CHECKOUT_RATE_LIMIT)

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
    // Server-side Price Verification
    // ========================================================================

    for (const item of items) {
      if (item.variantId) {
        const variant = variantMap.get(item.variantId)
        if (variant && variant.price !== item.price) {
          return NextResponse.json(
            { message: `Price changed for ${item.name}. Please refresh your cart.` },
            { status: 400 }
          )
        }
      }
    }

    // Recalculate subtotal server-side
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

        if (calculatedSubtotal >= minOrder) {
          const discountValue = Number(code.value) || Number(code.discount_value) || 0
          const discountType = code.type || code.discount_type
          if (discountType === "percentage") {
            discount = (calculatedSubtotal * discountValue) / 100
            const maxDiscount = Number(code.max_discount) || Number(code.max_discount_amount) || 0
            if (maxDiscount) {
              discount = Math.min(discount, maxDiscount)
            }
          } else {
            discount = discountValue
          }
          discountCodeId = code._id.toString()
        } else {
          // Min order not met — roll back the usage increment
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

    const shipping = shippingCost
    const total = Math.max(0, calculatedSubtotal - discount + shipping)

    // ========================================================================
    // Razorpay Order (Prepaid Only)
    // ========================================================================

    let razorpayOrderId = null
    let amountInPaise = 0

    if (paymentMethod === "prepaid") {
      amountInPaise = Math.round(total * 100)
      const razorpay = getRazorpay()
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `order_${Date.now()}`,
      })
      razorpayOrderId = razorpayOrder.id
    }

    // ========================================================================
    // Database Order Creation
    // ========================================================================

    const orderDoc = {
      user_id: userId && ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
      email,
      order_number: `AL-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      subtotal: calculatedSubtotal,
      discount_amount: discount,
      discount_code_id: discountCodeId,
      shipping_amount: shipping,
      total,
      shipping_address: shippingAddress,
      razorpay_order_id: razorpayOrderId,
      wallet_amount_used: walletAmountUsed || 0,
      estimated_delivery_days: estimatedDays || null,
      payment_method: paymentMethod,
      status: paymentMethod === "cod" ? "confirmed" : "pending",
      created_at: new Date(),
      updated_at: new Date(),
    }

    const orderResult = await db.collection("orders").insertOne(orderDoc)
    const orderId = orderResult.insertedId.toString()
    const orderNumber = orderDoc.order_number

    // Create order line items
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

    // Coupon usage already incremented atomically during validation above

    // ========================================================================
    // COD Order Processing
    // ========================================================================

    if (paymentMethod === "cod") {
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

      // Create Blue Dart shipment (non-blocking, only if configured)
      const isBlueDartConfigured = !!(process.env.BLUEDART_LOGIN_ID && process.env.BLUEDART_LICENSE_KEY)
      if (isBlueDartConfigured) try {
        const customerName = process.env.BLUEDART_CUSTOMER_NAME || ""
        const customerCode = process.env.BLUEDART_CUSTOMER_CODE || ""
        const originArea = process.env.BLUEDART_ORIGIN_AREA || ""
        const warehousePincode = "125001"
        // BlueDart expects /Date(epoch_ms)/ format
        const pickupDate = `/Date(${Date.now()})/`
        const pickupTime = "1400"

        const waybillResult = await blueDartClient.generateWaybill({
          Consignee: {
            ConsigneeName: shippingAddress.full_name,
            ConsigneeAddress1: shippingAddress.line1,
            ConsigneeAddress2: shippingAddress.line2 || undefined,
            ConsigneePincode: shippingAddress.pincode,
            ConsigneeMobile: shippingAddress.phone,
          },
          Shipper: {
            CustomerName: customerName,
            CustomerCode: customerCode,
            OriginArea: originArea,
            CustomerAddress1: "",
            CustomerPincode: warehousePincode,
            CustomerMobile: "",
            Sender: customerName,
          },
          Services: {
            ProductCode: "A",
            ProductType: 1,
            SubProductCode: "C", // COD
            PieceCount: "1",
            ActualWeight: "0.5",
            CreditReferenceNo: orderNumber,
            DeclaredValue: String(calculatedSubtotal),
            CollectableAmount: total, // COD collectable amount
            PickupDate: pickupDate,
            PickupTime: pickupTime,
            RegisterPickup: true, // Auto-register pickup with waybill
          },
        })

        const awbNo = waybillResult.GenerateWayBillResult?.AWBNo
        if (awbNo) {
          await db.collection("orders").updateOne(
            { _id: orderResult.insertedId },
            {
              $set: {
                awb_number: awbNo,
                courier_name: "Blue Dart",
              },
            }
          )
        }
      } catch (shippingError) {
        console.error("Blue Dart shipment creation error (non-fatal):", shippingError)
      }

      return NextResponse.json({
        orderId,
        orderNumber,
        paymentMethod: "cod",
        success: true,
      })
    }

    // ========================================================================
    // Prepaid Order Response
    // ========================================================================

    return NextResponse.json({
      orderId,
      razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      paymentMethod: "prepaid",
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
