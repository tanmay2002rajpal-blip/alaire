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

interface OrderItemData {
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  price: number
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(`verify-payment:${clientIp}`, { maxRequests: 10, windowMs: 60000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Auth check
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
      orderId,
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
    // Fetch Order Details
    // ========================================================================

    const order = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
    })

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      )
    }

    const orderItems = await db
      .collection<OrderItemData>("order_items")
      .find({ order_id: new ObjectId(orderId) })
      .toArray()

    // ========================================================================
    // Update Order Status
    // ========================================================================

    await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: "paid",
          razorpay_payment_id,
          paid_at: new Date(),
          updated_at: new Date(),
        },
      }
    )

    // ========================================================================
    // Wallet Balance Deduction
    // ========================================================================

    if (order.wallet_amount_used > 0 && order.user_id) {
      const wallet = await db
        .collection("wallets")
        .findOne({ user_id: order.user_id })

      if (wallet) {
        await db
          .collection("wallets")
          .updateOne(
            { _id: wallet._id, balance: { $gte: order.wallet_amount_used } },
            { $inc: { balance: -order.wallet_amount_used } }
          )

        await db.collection("wallet_transactions").insertOne({
          wallet_id: wallet._id,
          type: "debit",
          amount: order.wallet_amount_used,
          description: `Used for order ${order.order_number || orderId}`,
          created_at: new Date(),
        })
      }
    }

    // ========================================================================
    // Order Status History
    // ========================================================================

    await db.collection("order_status_history").insertOne({
      order_id: new ObjectId(orderId),
      status: "paid",
      note: `Payment received via Razorpay (${razorpay_payment_id})${
        order.wallet_amount_used > 0 ? ` + \u20B9${order.wallet_amount_used} from wallet` : ""
      }`,
      created_at: new Date(),
    })

    // ========================================================================
    // Order Confirmation Email (Non-blocking)
    // ========================================================================

    try {
      const shippingAddress = order.shipping_address as {
        full_name: string
        phone: string
        line1: string
        line2?: string
        city: string
        state: string
        pincode: string
      }

      if (shippingAddress && orderItems.length > 0) {
        await sendOrderConfirmationEmail({
          orderId,
          orderNumber: order.order_number || orderId.slice(0, 8).toUpperCase(),
          customerName: shippingAddress.full_name,
          customerEmail: order.email,
          items: orderItems.map((item: OrderItemData) => ({
            product_name: item.product_name,
            variant_name: item.variant_name ?? undefined,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: order.subtotal || 0,
          discount: order.discount_amount || 0,
          shipping: order.shipping_amount || 0,
          walletUsed: order.wallet_amount_used || 0,
          total: order.total || 0,
          shippingAddress,
          paymentMethod: order.payment_method === "cod" ? "Cash on Delivery" : "Prepaid (Razorpay)",
        })
      }
    } catch (emailError) {
      console.error("Order confirmation email failed (non-fatal):", emailError)
    }

    // Admin notification email (non-blocking)
    try {
      const adminShippingAddr = order.shipping_address as {
        full_name: string
        phone: string
        line1: string
        line2?: string
        city: string
        state: string
        pincode: string
      }

      if (adminShippingAddr && orderItems.length > 0) {
        await sendAdminOrderNotification({
          orderId,
          orderNumber: order.order_number || orderId.slice(0, 8).toUpperCase(),
          customerName: adminShippingAddr.full_name,
          customerEmail: order.email,
          customerPhone: adminShippingAddr.phone,
          items: orderItems.map((item: OrderItemData) => ({
            product_name: item.product_name,
            variant_name: item.variant_name ?? undefined,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: order.subtotal || 0,
          discount: order.discount_amount || 0,
          shipping: order.shipping_amount || 0,
          total: order.total || 0,
          paymentMethod: "Prepaid (Razorpay)",
          shippingAddress: adminShippingAddr,
        })
      }
    } catch (adminEmailError) {
      console.error("Admin notification email failed (non-fatal):", adminEmailError)
    }

    // ========================================================================
    // Stock Reduction
    // ========================================================================

    if (orderItems.length > 0) {
      for (const item of orderItems) {
        if (item.variant_id && ObjectId.isValid(item.variant_id)) {
          const result = await db.collection("product_variants").updateOne(
            { _id: new ObjectId(item.variant_id), stock_quantity: { $gte: item.quantity } },
            { $inc: { stock_quantity: -item.quantity } }
          )
          if (result.modifiedCount === 0) {
            console.error(`Stock insufficient for variant ${item.variant_id}`)
          }
        }
      }
    }

    // ========================================================================
    // Blue Dart Shipment Creation (Non-blocking)
    // ========================================================================

    try {
      const shippingAddress = order.shipping_address as {
        full_name: string
        phone: string
        line1: string
        line2?: string
        city: string
        state: string
        pincode: string
      }

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
        // Pickup must be in the future — schedule for tomorrow
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
            SubProductCode: "P", // Prepaid
            PieceCount: "1",
            ActualWeight: "0.5",
            CreditReferenceNo: order.order_number || orderId,
            DeclaredValue: String(order.subtotal),
            PickupDate: pickupDate,
            PickupTime: pickupTime,
            RegisterPickup: true, // Auto-register pickup
          },
        })

        const awbNo = waybillResult.GenerateWayBillResult?.AWBNo
        if (awbNo) {
          await db.collection("orders").updateOne(
            { _id: new ObjectId(orderId) },
            {
              $set: {
                awb_number: awbNo,
                courier_name: "Blue Dart",
              },
            }
          )
        }
      }
    } catch (shippingError) {
      console.error("Blue Dart shipment creation error (non-fatal):", shippingError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
