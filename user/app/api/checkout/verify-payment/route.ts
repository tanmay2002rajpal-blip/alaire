import { NextResponse } from "next/server"
import crypto from "crypto"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { blueDartClient } from "@/lib/bluedart/client"
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation"
import { sendAdminOrderNotification } from "@/lib/emails/admin-notification"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { verifyPaymentSchema, validateRequest, type VerifyPaymentInput } from "@/lib/validations/api"

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(`verify-payment:${clientIp}`, { maxRequests: 10, windowMs: 60000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let validatedBody: VerifyPaymentInput
    try {
      const rawBody = await request.json()
      validatedBody = validateRequest(verifyPaymentSchema, rawBody)
    } catch (validationError) {
      return NextResponse.json(
        { message: validationError instanceof Error ? validationError.message : "Invalid request data" },
        { status: 400 }
      )
    }

    const {
      sessionId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = validatedBody

    // ========================================================================
    // Signature Verification
    // ========================================================================

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    const isValid = generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature, "hex"),
        Buffer.from(razorpay_signature, "hex")
      )

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid payment signature" },
        { status: 400 }
      )
    }

    const db = await getDb()

    // ========================================================================
    // Fetch Checkout Session
    // ========================================================================

    const checkoutSession = await db.collection("checkout_sessions").findOne({
      _id: new ObjectId(sessionId),
    })

    if (!checkoutSession) {
      return NextResponse.json(
        { message: "Checkout session not found or expired" },
        { status: 404 }
      )
    }

    // Verify Razorpay order ID matches
    if (checkoutSession.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json(
        { message: "Payment order mismatch" },
        { status: 400 }
      )
    }

    // ========================================================================
    // Re-validate coupon and increment usage atomically
    // ========================================================================

    let discountCodeId: string | null = checkoutSession.discount_code_id || null
    let discount = checkoutSession.discount_amount || 0

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

      if (!couponResult) {
        discount = 0
        discountCodeId = null
      }
    }

    // Recalculate total with potentially updated discount
    const total = Math.max(0, checkoutSession.subtotal - discount + checkoutSession.shipping_amount)

    // ========================================================================
    // Create Order (only now, after payment confirmed)
    // ========================================================================

    const items = checkoutSession.items
    const shippingAddress = checkoutSession.shipping_address

    const orderDoc = {
      user_id: checkoutSession.user_id,
      email: checkoutSession.email,
      order_number: `AL-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      subtotal: checkoutSession.subtotal,
      discount_amount: discount,
      discount_code_id: discountCodeId,
      shipping_amount: checkoutSession.shipping_amount,
      total,
      shipping_address: shippingAddress,
      razorpay_order_id,
      razorpay_payment_id,
      wallet_amount_used: checkoutSession.wallet_amount_used || 0,
      estimated_delivery_days: checkoutSession.estimated_delivery_days || null,
      payment_method: "prepaid",
      status: "paid",
      paid_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    }

    const orderResult = await db.collection("orders").insertOne(orderDoc)
    const orderId = orderResult.insertedId.toString()
    const orderNumber = orderDoc.order_number

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
      note: `Payment received via Razorpay (${razorpay_payment_id})${
        checkoutSession.wallet_amount_used > 0 ? ` + ₹${checkoutSession.wallet_amount_used} from wallet` : ""
      }`,
      created_at: new Date(),
    })

    // ========================================================================
    // Wallet Balance Deduction
    // ========================================================================

    if (checkoutSession.wallet_amount_used > 0 && checkoutSession.user_id) {
      const wallet = await db
        .collection("wallets")
        .findOne({ user_id: checkoutSession.user_id })

      if (wallet) {
        await db
          .collection("wallets")
          .updateOne(
            { _id: wallet._id, balance: { $gte: checkoutSession.wallet_amount_used } },
            { $inc: { balance: -checkoutSession.wallet_amount_used } }
          )

        await db.collection("wallet_transactions").insertOne({
          wallet_id: wallet._id,
          type: "debit",
          amount: checkoutSession.wallet_amount_used,
          description: `Used for order ${orderNumber}`,
          created_at: new Date(),
        })
      }
    }

    // ========================================================================
    // Stock Reduction
    // ========================================================================

    for (const item of items) {
      if (item.variantId && ObjectId.isValid(item.variantId)) {
        const result = await db.collection("product_variants").updateOne(
          { _id: new ObjectId(item.variantId), stock_quantity: { $gte: item.quantity } },
          { $inc: { stock_quantity: -item.quantity } }
        )
        if (result.modifiedCount === 0) {
          console.error(`Stock insufficient for variant ${item.variantId}`)
        }
      }
    }

    // ========================================================================
    // Delete Checkout Session
    // ========================================================================

    await db.collection("checkout_sessions").deleteOne({ _id: new ObjectId(sessionId) })

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
          walletUsed: checkoutSession.wallet_amount_used || 0,
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
    // Blue Dart Shipment (non-blocking)
    // ========================================================================

    try {
      if (shippingAddress && orderItems.length > 0) {
        const isSandbox = process.env.BLUEDART_SANDBOX === "true"
        const customerName = isSandbox
          ? process.env.BLUEDART_SANDBOX_CUSTOMER_NAME?.trim() || process.env.BLUEDART_CUSTOMER_NAME || ""
          : process.env.BLUEDART_CUSTOMER_NAME || ""
        const customerCode = isSandbox
          ? process.env.BLUEDART_SANDBOX_CUSTOMER_CODE?.trim() || process.env.BLUEDART_CUSTOMER_CODE || ""
          : process.env.BLUEDART_CUSTOMER_CODE || ""
        const originArea = isSandbox
          ? process.env.BLUEDART_SANDBOX_ORIGIN_AREA?.trim() || process.env.BLUEDART_ORIGIN_AREA || ""
          : process.env.BLUEDART_ORIGIN_AREA || ""
        const warehousePincode = isSandbox
          ? process.env.BLUEDART_SANDBOX_WAREHOUSE_PINCODE?.trim() || process.env.BLUEDART_WAREHOUSE_PINCODE?.trim() || "125001"
          : process.env.BLUEDART_WAREHOUSE_PINCODE?.trim() || "125001"
        const warehouseAddress = isSandbox
          ? process.env.BLUEDART_SANDBOX_WAREHOUSE_ADDRESS?.trim() || process.env.BLUEDART_WAREHOUSE_ADDRESS?.trim() || ""
          : process.env.BLUEDART_WAREHOUSE_ADDRESS?.trim() || ""
        const warehouseMobile = isSandbox
          ? process.env.BLUEDART_SANDBOX_WAREHOUSE_MOBILE?.trim() || process.env.BLUEDART_WAREHOUSE_MOBILE?.trim() || ""
          : process.env.BLUEDART_WAREHOUSE_MOBILE?.trim() || ""
        const pickupDate = `/Date(${Date.now() + 24 * 60 * 60 * 1000})/`
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
            CustomerAddress1: warehouseAddress,
            CustomerPincode: warehousePincode,
            CustomerMobile: warehouseMobile,
            Sender: customerName,
          },
          Services: {
            ProductCode: "A",
            ProductType: 1,
            SubProductCode: "P",
            PieceCount: "1",
            ActualWeight: "0.5",
            PDFOutputNotRequired: false,
            CreditReferenceNo: orderNumber,
            DeclaredValue: String(checkoutSession.subtotal),
            PickupDate: pickupDate,
            PickupTime: pickupTime,
            RegisterPickup: true,
          },
        })

        const awbNo = waybillResult.GenerateWayBillResult?.AWBNo
        const pickupToken = waybillResult.GenerateWayBillResult?.TokenNumber
        const labelPdf = waybillResult.GenerateWayBillResult?.AWBPrintContent
        if (awbNo) {
          await db.collection("orders").updateOne(
            { _id: orderResult.insertedId },
            {
              $set: {
                awb_number: awbNo,
                pickup_token: pickupToken || null,
                courier_name: "Blue Dart",
                shipping_label_pdf: labelPdf || null,
              },
            }
          )
        }
      }
    } catch (shippingError) {
      console.error("Blue Dart shipment creation error (non-fatal):", shippingError)
    }

    return NextResponse.json({ success: true, orderId })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
