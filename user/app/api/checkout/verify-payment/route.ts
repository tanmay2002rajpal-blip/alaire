import { NextResponse } from "next/server"
import crypto from "crypto"
import { getDb } from "@/lib/db/client"
import { blueDartClient } from "@/lib/bluedart/client"
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation"
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

    if (generatedSignature !== razorpay_signature) {
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
      $expr: { $eq: [{ $toString: "$_id" }, orderId] },
    })

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      )
    }

    const orderItems = await db
      .collection<OrderItemData>("order_items")
      .find({ order_id: orderId })
      .toArray()

    // ========================================================================
    // Update Order Status
    // ========================================================================

    await db.collection("orders").updateOne(
      { $expr: { $eq: [{ $toString: "$_id" }, orderId] } },
      {
        $set: {
          status: "paid",
          razorpay_payment_id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
            { _id: wallet._id },
            { $inc: { balance: -order.wallet_amount_used } }
          )

        await db.collection("wallet_transactions").insertOne({
          wallet_id: wallet._id.toString(),
          type: "debit",
          amount: order.wallet_amount_used,
          description: `Used for order ${order.order_number || orderId}`,
          created_at: new Date().toISOString(),
        })
      }
    }

    // ========================================================================
    // Order Status History
    // ========================================================================

    await db.collection("order_status_history").insertOne({
      order_id: orderId,
      status: "paid",
      note: `Payment received via Razorpay (${razorpay_payment_id})${
        order.wallet_amount_used > 0 ? ` + \u20B9${order.wallet_amount_used} from wallet` : ""
      }`,
      created_at: new Date().toISOString(),
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

    // ========================================================================
    // Stock Reduction
    // ========================================================================

    if (orderItems.length > 0) {
      for (const item of orderItems) {
        if (item.variant_id) {
          await db.collection("product_variants").updateOne(
            { $expr: { $eq: [{ $toString: "$_id" }, item.variant_id] } },
            { $inc: { stock_quantity: -item.quantity } }
          )
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
        const customerName = process.env.BLUEDART_CUSTOMER_NAME || ""
        const customerCode = process.env.BLUEDART_CUSTOMER_CODE || ""
        const originArea = process.env.BLUEDART_ORIGIN_AREA || ""
        const warehousePincode = "125001"
        const pickupDate = new Date().toISOString().split("T")[0]
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
            SubProductCode: "P",
            PieceCount: "1",
            ActualWeight: "0.5",
            CreditReferenceNo: order.order_number || orderId,
            DeclaredValue: String(order.subtotal),
            PickupDate: pickupDate,
            PickupTime: pickupTime,
          },
        })

        const awbNo = waybillResult.GenerateWayBillResult?.AWBNo
        if (awbNo) {
          await db.collection("orders").updateOne(
            { $expr: { $eq: [{ $toString: "$_id" }, orderId] } },
            {
              $set: {
                awb_number: awbNo,
                courier_name: "Blue Dart",
              },
            }
          )

          await blueDartClient.registerPickup({
            PickupDate: pickupDate,
            PickupTime: pickupTime,
            CustomerCode: customerCode,
            OriginArea: originArea,
            CustomerName: customerName,
            CustomerMobile: "",
            CustomerAddress1: "",
            CustomerPincode: warehousePincode,
            PackageCount: 1,
            ProductCode: "A",
          })
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
