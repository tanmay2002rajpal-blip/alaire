import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db/client"
import { createShipment } from "@/lib/fship/actions"
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation"
import { sendAdminOrderNotification } from "@/lib/emails/admin-notification"

/**
 * Fulfil a paid Razorpay order EXACTLY ONCE (called by verify-payment after the
 * browser confirms a successful payment).
 *
 * Idempotency: the checkout_sessions doc is claimed atomically via findOneAndDelete
 * BEFORE anything is created. Whoever wins the claim runs the full fulfillment; any
 * later caller (replay / double-submit) finds no session and returns the
 * already-created order — this is success, NOT an error.
 */
export async function fulfillPaidOrder(params: {
  razorpayOrderId: string
  razorpayPaymentId: string
}): Promise<{ created: boolean; orderId: string | null; error?: string }> {
  const { razorpayOrderId, razorpayPaymentId } = params

  const db = await getDb()

  // ========================================================================
  // Claim Checkout Session ATOMICALLY (idempotency guard)
  // ========================================================================
  // Delete-and-return the session in one atomic op BEFORE creating anything,
  // so concurrent/replayed calls can't double-create order/stock/wallet/coupon.
  // We scope the claim to the matching razorpay_order_id.

  const checkoutSession = await db.collection("checkout_sessions").findOneAndDelete({
    razorpay_order_id: razorpayOrderId,
  })

  if (!checkoutSession) {
    // Session already consumed (replay) or never matched. If an order was
    // already created for this payment, return it — idempotent success.
    const existingOrder = await db
      .collection("orders")
      .findOne({ razorpay_order_id: razorpayOrderId })
    if (existingOrder) {
      return { created: false, orderId: existingOrder._id.toString() }
    }
    return { created: false, orderId: null, error: "Checkout session not found or expired" }
  }

  // ========================================================================
  // Re-validate coupon and increment usage atomically
  // ========================================================================

  let discountCodeId: string | null = checkoutSession.discount_code_id || null
  const discount = checkoutSession.discount_amount || 0

  // Use the ONE captured total from the session for the order doc, emails and
  // FShip. This is the exact amount the customer was charged (subtotal −
  // discount + shipping − wallet). Never record more than was captured.
  const total = checkoutSession.total
  const walletUsed = checkoutSession.wallet_amount_used || 0
  const items = checkoutSession.items
  const shippingAddress = checkoutSession.shipping_address

  // CRITICAL SECTION (recoverable): the checkout session was already claimed
  // (findOneAndDelete) above, so nothing recreates it if we throw here. If the
  // coupon increment or the order insert fails before the order row is durable,
  // a retry would otherwise find no session AND no order — the exact "charged,
  // no order" gap this feature closes. So on ANY failure below we re-insert the
  // claimed session (and undo the coupon increment) before re-throwing, letting
  // a later retry (webhook or browser) re-claim the session and fulfil it.
  let orderResult!: { insertedId: ObjectId }
  let orderNumber!: string
  let couponUsageIncremented = false

  try {
  if (checkoutSession.discount_code && discountCodeId) {
    const now = new Date()
    const couponResult = await db.collection("coupons").findOneAndUpdate(
      {
        _id: new ObjectId(discountCodeId),
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
            {
              $and: [
                { $eq: [{ $ifNull: ["$usage_limit", null] }, null] },
                { $eq: [{ $ifNull: ["$max_uses", null] }, null] },
              ],
            },
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

    if (couponResult) {
      couponUsageIncremented = true
    } else {
      // Coupon failed re-validation AFTER the customer already paid. Do NOT
      // strip the discount — that would record a HIGHER total than captured.
      // Keep the session's original discount and total exactly as charged.
    }
  }

  // ========================================================================
  // Create Order (only now, after payment confirmed)
  // ========================================================================

  const orderDoc = {
    user_id: checkoutSession.user_id,
    email: checkoutSession.email,
    order_number: `AL-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    subtotal: checkoutSession.subtotal,
    discount_amount: discount,
    discount_code_id: discountCodeId,
    shipping_amount: checkoutSession.shipping_amount,
    shipping_cost: checkoutSession.shipping_cost ?? checkoutSession.shipping_amount,
    total,
    shipping_address: shippingAddress,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    wallet_amount_used: walletUsed,
    estimated_delivery_days: checkoutSession.estimated_delivery_days || null,
    payment_method: "prepaid",
    status: "paid",
    paid_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  }

  orderResult = await db.collection("orders").insertOne(orderDoc)
  orderNumber = orderDoc.order_number
  } catch (criticalError) {
    // Order was NOT durably created. Re-insert the claimed session (restoring
    // its original _id) and roll back any coupon increment so a retry (webhook
    // or browser) can re-claim the session and fulfil the order cleanly.
    try {
      await db.collection("checkout_sessions").insertOne(checkoutSession)
      if (couponUsageIncremented && discountCodeId) {
        await db.collection("coupons").updateOne(
          { _id: new ObjectId(discountCodeId) },
          { $inc: { usage_count: -1 } }
        )
      }
    } catch (restoreError) {
      // Restore itself failed — the session stays lost. Log loudly so the
      // captured-but-unfulfilled payment can be reconciled manually.
      console.error(
        `CRITICAL: failed to restore checkout session ${checkoutSession._id} after order-creation failure (razorpay_order_id ${razorpayOrderId}):`,
        restoreError
      )
    }
    throw criticalError
  }

  const orderId = orderResult.insertedId.toString()

  // Create order line items
  const orderItems = items.map((item: any) => ({
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

  // ========================================================================
  // Status History
  // ========================================================================

  await db.collection("order_status_history").insertOne({
    order_id: orderResult.insertedId,
    status: "paid",
    note: `Payment received via Razorpay (${razorpayPaymentId})${
      checkoutSession.wallet_amount_used > 0 ? ` + ₹${checkoutSession.wallet_amount_used} from wallet` : ""
    }`,
    created_at: new Date(),
  })

  // ========================================================================
  // Wallet Balance Deduction
  // ========================================================================

  if (walletUsed > 0 && checkoutSession.user_id) {
    // Match wallets stored under either the string or ObjectId form of user_id.
    const walletUserIds: (string | ObjectId)[] = [checkoutSession.user_id]
    const uidStr = checkoutSession.user_id?.toString?.()
    if (uidStr && uidStr !== checkoutSession.user_id) walletUserIds.push(uidStr)

    const wallet = await db
      .collection("wallets")
      .findOne({ user_id: { $in: walletUserIds } })

    if (wallet) {
      // Atomic debit guarded by sufficient balance — matches the amount applied.
      const debitResult = await db
        .collection("wallets")
        .updateOne(
          { _id: wallet._id, balance: { $gte: walletUsed } },
          { $inc: { balance: -walletUsed } }
        )

      if (debitResult.modifiedCount > 0) {
        await db.collection("wallet_transactions").insertOne({
          wallet_id: wallet._id,
          type: "debit",
          amount: walletUsed,
          description: `Used for order ${orderNumber}`,
          created_at: new Date(),
        })
      } else {
        // Balance dropped below the applied amount since checkout, so the guarded
        // debit matched nothing. The order was already charged with the wallet
        // amount applied — do NOT fail it, but flag so the debit isn't silently
        // lost (customer would otherwise get free credit).
        console.error(
          `Wallet debit failed for order ${orderNumber}: balance below ₹${walletUsed} (wallet ${wallet._id})`
        )
        await db.collection("orders").updateOne(
          { _id: orderResult.insertedId },
          { $set: { wallet_debit_failed: true, wallet_debit_failed_amount: walletUsed } }
        )
      }
    } else {
      // walletUsed > 0 but no wallet record found — same silent-loss risk. Flag it.
      console.error(
        `Wallet debit failed for order ${orderNumber}: no wallet found for user (₹${walletUsed} applied)`
      )
      await db.collection("orders").updateOne(
        { _id: orderResult.insertedId },
        { $set: { wallet_debit_failed: true, wallet_debit_failed_amount: walletUsed } }
      )
    }
  }

  // ========================================================================
  // Stock Reduction
  // ========================================================================

  const stockWarningItems: string[] = []

  for (const item of items) {
    if (item.variantId && ObjectId.isValid(item.variantId)) {
      const result = await db.collection("product_variants").updateOne(
        { _id: new ObjectId(item.variantId), stock_quantity: { $gte: item.quantity } },
        { $inc: { stock_quantity: -item.quantity } }
      )
      if (result.modifiedCount === 0) {
        console.error(`Stock insufficient for variant ${item.variantId}`)
        stockWarningItems.push(item.variantId)
      }
    } else if (item.productId && ObjectId.isValid(item.productId)) {
      // Mirror the COD path: productId-only items decrement the product's variant stock.
      const result = await db.collection("product_variants").updateOne(
        { product_id: new ObjectId(item.productId), stock_quantity: { $gte: item.quantity } },
        { $inc: { stock_quantity: -item.quantity } }
      )
      if (result.modifiedCount === 0) {
        console.error(`Stock insufficient for product ${item.productId}`)
        stockWarningItems.push(item.productId)
      }
    }
  }

  // Flag the order if any items had insufficient stock so admin can review
  if (stockWarningItems.length > 0) {
    await db.collection("orders").updateOne(
      { _id: orderResult.insertedId },
      {
        $set: {
          stock_warning: true,
          stock_warning_variants: stockWarningItems,
        },
      }
    )
  }

  // Checkout session was already consumed atomically (findOneAndDelete) at the
  // top of this function — nothing more to delete here.

  // ========================================================================
  // Emails (non-blocking)
  // ========================================================================

  try {
    if (shippingAddress && orderItems.length > 0) {
      await sendOrderConfirmationEmail({
        orderId,
        orderNumber,
        customerName: shippingAddress.full_name,
        customerEmail: checkoutSession.email,
        items: orderItems.map((item: any) => ({
          product_name: item.product_name,
          variant_name: item.variant_name ?? undefined,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: checkoutSession.subtotal,
        discount,
        shipping: checkoutSession.shipping_amount,
        walletUsed,
        total,
        shippingAddress,
        paymentMethod: "Prepaid (Razorpay)",
      })
    }
  } catch (emailError) {
    console.error("Order confirmation email failed (non-fatal):", emailError)
  }

  try {
    if (shippingAddress && orderItems.length > 0) {
      await sendAdminOrderNotification({
        orderId,
        orderNumber,
        customerName: shippingAddress.full_name,
        customerEmail: checkoutSession.email,
        customerPhone: shippingAddress.phone,
        items: orderItems.map((item: any) => ({
          product_name: item.product_name,
          variant_name: item.variant_name ?? undefined,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: checkoutSession.subtotal,
        discount,
        shipping: checkoutSession.shipping_amount,
        total,
        paymentMethod: "Prepaid (Razorpay)",
        shippingAddress,
      })
    }
  } catch (adminEmailError) {
    console.error("Admin notification email failed (non-fatal):", adminEmailError)
  }

  // ========================================================================
  // FShip Shipment (non-blocking)
  // ========================================================================

  // Session cart items carry no sku field, so resolve the real SKU from the
  // product_variants (same source used for stock above) and pass it to FShip
  // like the COD path does. Fall back gracefully when nothing is resolvable.
  const variantObjectIds = items
    .filter((item: any) => item.variantId && ObjectId.isValid(item.variantId))
    .map((item: any) => new ObjectId(item.variantId))
  const productObjectIds = items
    .filter((item: any) => item.productId && ObjectId.isValid(item.productId))
    .map((item: any) => new ObjectId(item.productId))

  const skuByVariantId = new Map<string, string>()
  const skuByProductId = new Map<string, string>()
  if (variantObjectIds.length > 0 || productObjectIds.length > 0) {
    const orClauses: any[] = []
    if (variantObjectIds.length > 0) orClauses.push({ _id: { $in: variantObjectIds } })
    if (productObjectIds.length > 0) orClauses.push({ product_id: { $in: productObjectIds } })
    const variantDocs = await db
      .collection("product_variants")
      .find({ $or: orClauses })
      .toArray()
    for (const v of variantDocs) {
      if (!v.sku) continue
      skuByVariantId.set(v._id.toString(), v.sku)
      const pid = v.product_id?.toString?.()
      if (pid && !skuByProductId.has(pid)) skuByProductId.set(pid, v.sku)
    }
  }

  try {
    if (shippingAddress && orderItems.length > 0) {
      const totalQty = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      const shipmentWeight = 0.5 * totalQty
      const shipmentResult = await createShipment({
        orderId: orderNumber,
        consigneeName: shippingAddress.full_name,
        consigneeAddress1: shippingAddress.line1,
        consigneeAddress2: shippingAddress.line2,
        consigneePincode: shippingAddress.pincode,
        consigneeMobile: shippingAddress.phone,
        consigneeEmail: checkoutSession.email,
        consigneeCity: shippingAddress.city || "",
        weight: shipmentWeight,
        declaredValue: total,
        pickupDate: new Date().toISOString().split("T")[0],
        pickupTime: "14:00",
        paymentMode: "prepaid",
        products: items.map((item: any) => {
          const resolvedSku =
            (item.variantId && skuByVariantId.get(item.variantId.toString())) ||
            (item.productId && skuByProductId.get(item.productId.toString())) ||
            item.sku ||
            undefined
          return {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            ...(resolvedSku ? { sku: resolvedSku } : {}),
          }
        }),
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

  return { created: true, orderId }
}
