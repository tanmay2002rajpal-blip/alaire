import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import Razorpay from "razorpay"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { blueDartClient } from "@/lib/bluedart/client"
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation"
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
    const userId = session?.user?.id ?? null

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
      shippingAddress,
      email,
      discountCode,
      walletAmountUsed = 0,
      paymentMethod = "prepaid",
    } = validatedBody

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

    const outOfStockItems: string[] = []
    for (const item of items) {
      let stockQuantity = 0

      if (item.variantId) {
        const variant = await db
          .collection("product_variants")
          .findOne({ $expr: { $eq: [{ $toString: "$_id" }, item.variantId] } })
        stockQuantity = variant?.stock_quantity ?? 0
      } else {
        const variants = await db
          .collection("product_variants")
          .find({ product_id: item.productId })
          .toArray()
        if (variants.length > 0) {
          stockQuantity = variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
        }
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
    // Discount Calculation
    // ========================================================================

    let discount = 0
    let discountCodeId: string | null = null

    if (discountCode) {
      const code = await db
        .collection("discount_codes")
        .findOne({ code: discountCode.toUpperCase(), is_active: true })

      if (code) {
        const now = new Date()
        const validFrom = code.valid_from ? new Date(code.valid_from) : null
        const validUntil = code.valid_until ? new Date(code.valid_until) : null
        const minOrder = code.min_order_amount ?? 0

        if (
          (!validFrom || now >= validFrom) &&
          (!validUntil || now <= validUntil) &&
          subtotal >= minOrder &&
          (code.usage_limit === null || code.usage_count < code.usage_limit)
        ) {
          if (code.discount_type === "percentage") {
            discount = (subtotal * code.discount_value) / 100
            if (code.max_discount_amount) {
              discount = Math.min(discount, code.max_discount_amount)
            }
          } else {
            discount = code.discount_value
          }
          discountCodeId = code._id.toString()
        }
      }
    }

    // ========================================================================
    // Total Calculation
    // ========================================================================

    const shipping = shippingCost
    const actualWalletUsed = paymentMethod === "cod"
      ? 0
      : Math.min(walletAmountUsed, Math.max(0, subtotal - discount + shipping))

    const beforeWallet = Math.max(0, subtotal - discount + shipping)
    const total = Math.max(0, beforeWallet - actualWalletUsed)

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
      user_id: userId,
      email,
      order_number: `AL-${Date.now().toString(36).toUpperCase()}`,
      subtotal,
      discount_amount: discount,
      discount_code_id: discountCodeId,
      shipping_amount: shipping,
      wallet_amount_used: actualWalletUsed,
      total,
      shipping_address: shippingAddress,
      razorpay_order_id: razorpayOrderId,
      payment_method: paymentMethod,
      status: paymentMethod === "cod" ? "confirmed" : "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const orderResult = await db.collection("orders").insertOne(orderDoc)
    const orderId = orderResult.insertedId.toString()
    const orderNumber = orderDoc.order_number

    // Create order line items
    const orderItems = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      product_name: item.name,
      variant_name: item.variantName ?? null,
      price: item.price,
      price_at_purchase: item.price,
      quantity: item.quantity,
      image_url: item.image ?? null,
      created_at: new Date().toISOString(),
    }))

    await db.collection("order_items").insertMany(orderItems)

    // Increment discount code usage
    if (discountCodeId) {
      await db.collection("discount_codes").updateOne(
        { _id: new ObjectId(discountCodeId) },
        { $inc: { current_uses: 1, usage_count: 1 } }
      )
    }

    // ========================================================================
    // COD Order Processing
    // ========================================================================

    if (paymentMethod === "cod") {
      await db.collection("order_status_history").insertOne({
        order_id: orderId,
        status: "confirmed",
        note: "Cash on Delivery order placed",
        created_at: new Date().toISOString(),
      })

      if (actualWalletUsed > 0 && userId) {
        const wallet = await db
          .collection("wallets")
          .findOne({ user_id: userId })

        if (wallet) {
          await db
            .collection("wallets")
            .updateOne(
              { _id: wallet._id },
              { $inc: { balance: -actualWalletUsed } }
            )

          await db.collection("wallet_transactions").insertOne({
            wallet_id: wallet._id.toString(),
            type: "debit",
            amount: actualWalletUsed,
            description: `Used for order ${orderNumber}`,
            created_at: new Date().toISOString(),
          })
        }
      }

      // Decrease stock
      for (const item of items) {
        if (item.variantId) {
          await db.collection("product_variants").updateOne(
            { $expr: { $eq: [{ $toString: "$_id" }, item.variantId] } },
            { $inc: { stock_quantity: -item.quantity } }
          )
        }
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
          subtotal,
          discount,
          shipping,
          walletUsed: actualWalletUsed,
          total,
          shippingAddress,
          paymentMethod: "Cash on Delivery",
        })
      } catch (emailError) {
        console.error("Order confirmation email failed (non-fatal):", emailError)
      }

      // Create Blue Dart shipment (non-blocking)
      try {
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
            SubProductCode: "C",
            PieceCount: "1",
            ActualWeight: "0.5",
            CreditReferenceNo: orderNumber,
            DeclaredValue: String(subtotal),
            PickupDate: pickupDate,
            PickupTime: pickupTime,
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
