/**
 * @fileoverview Create Order API endpoint.
 * Handles order creation for both prepaid (Razorpay) and COD payments.
 *
 * Flow:
 * 1. Validate cart items and check stock availability
 * 2. Apply discount code if provided
 * 3. Calculate totals (subtotal, discount, shipping, wallet, final)
 * 4. Create Razorpay order (prepaid only)
 * 5. Create order and order items in database
 * 6. For COD: Send confirmation email, create Shiprocket order
 * 7. Return order details for checkout completion
 *
 * @module app/api/checkout/create-order
 */

import { NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createClient } from "@/lib/supabase/server"
import { shiprocketClient } from "@/lib/shiprocket/client"
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation"
import { createOrderSchema, validateRequest, type CreateOrderInput } from "@/lib/validations/api"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import type { CreateShiprocketOrderRequest } from "@/lib/shiprocket/types"

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/** Maximum checkout attempts per IP within the time window */
const CHECKOUT_RATE_LIMIT = {
  maxRequests: 10,  // 10 checkout attempts
  windowMs: 60000,  // per minute
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Lazily initializes and returns Razorpay instance.
 * Throws if credentials are not configured.
 *
 * @returns Razorpay instance
 * @throws Error if Razorpay credentials are missing
 */
function getRazorpay(): Razorpay {
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured")
  }
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/checkout/create-order
 *
 * Creates a new order in the system. Supports both prepaid (Razorpay)
 * and Cash on Delivery payment methods.
 *
 * For prepaid orders:
 * - Creates Razorpay order
 * - Returns Razorpay order details for client-side checkout
 *
 * For COD orders:
 * - Immediately confirms the order
 * - Sends confirmation email
 * - Creates Shiprocket shipment
 *
 * @param request - HTTP request with CreateOrderRequest body
 * @returns Order details and Razorpay info (prepaid) or success confirmation (COD)
 *
 * @example
 * ```ts
 * // Client-side usage
 * const response = await fetch('/api/checkout/create-order', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     items: cart.items,
 *     subtotal: 1999,
 *     shippingCost: 50,
 *     shippingAddress: { ... },
 *     email: 'customer@example.com',
 *     paymentMethod: 'prepaid',
 *   }),
 * })
 * const { razorpayOrderId, amount } = await response.json()
 * ```
 */
export async function POST(request: Request) {
  try {
    // ========================================================================
    // Rate Limiting
    // ========================================================================
    
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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Parse and validate request body
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

    // ========================================================================
    // Validation
    // ========================================================================

    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: "Cart is empty" },
        { status: 400 }
      )
    }

    // ========================================================================
    // Stock Availability Check
    // ========================================================================

    const outOfStockItems: string[] = []
    for (const item of items) {
      let stockQuantity = 0

      if (item.variantId) {
        // Check specific variant stock
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.variantId)
          .single()

        stockQuantity = variant?.stock_quantity ?? 0
      } else {
        // Sum all variant stocks for this product
        const { data: variants } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("product_id", item.productId)

        if (variants && variants.length > 0) {
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
        {
          message: "Some items are out of stock",
          outOfStockItems,
        },
        { status: 400 }
      )
    }

    // ========================================================================
    // Discount Calculation
    // ========================================================================

    let discount = 0
    let discountCodeId = null

    if (discountCode) {
      const { data: code } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (code) {
        const now = new Date()
        const validFrom = code.valid_from ? new Date(code.valid_from) : null
        const validUntil = code.valid_until ? new Date(code.valid_until) : null
        const minOrder = code.min_order_amount ?? 0

        // Validate code eligibility
        if (
          (!validFrom || now >= validFrom) &&
          (!validUntil || now <= validUntil) &&
          subtotal >= minOrder &&
          (code.usage_limit === null || code.usage_count < code.usage_limit)
        ) {
          // Calculate discount amount
          if (code.discount_type === "percentage") {
            discount = (subtotal * code.discount_value) / 100
            if (code.max_discount_amount) {
              discount = Math.min(discount, code.max_discount_amount)
            }
          } else {
            discount = code.discount_value
          }
          discountCodeId = code.id
        }
      }
    }

    // ========================================================================
    // Total Calculation
    // ========================================================================

    const shipping = shippingCost

    // Wallet can only be used for prepaid orders
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
      // Razorpay expects amount in paise (smallest currency unit)
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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        email,
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
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order creation error:", orderError)
      return NextResponse.json(
        { message: "Failed to create order" },
        { status: 500 }
      )
    }

    // Create order line items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      product_name: item.name,
      variant_name: item.variantName ?? null,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image ?? null,
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)

    if (itemsError) {
      console.error("Order items error:", itemsError)
      // Rollback: delete the order if items failed
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json(
        { message: "Failed to create order items" },
        { status: 500 }
      )
    }

    // Increment discount code usage if applied
    if (discountCodeId) {
      await supabase.rpc("increment_discount_usage", { code_id: discountCodeId })
    }

    // ========================================================================
    // COD Order Processing (Immediate Fulfillment)
    // ========================================================================

    if (paymentMethod === "cod") {
      // Record order status history
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "confirmed",
        note: "Cash on Delivery order placed",
      })

      // Deduct wallet balance if used (edge case for COD)
      if (actualWalletUsed > 0 && user?.id) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("id, balance")
          .eq("user_id", user.id)
          .single()

        if (wallet) {
          await supabase
            .from("wallets")
            .update({ balance: wallet.balance - actualWalletUsed })
            .eq("id", wallet.id)

          await supabase.from("wallet_transactions").insert({
            wallet_id: wallet.id,
            type: "debit",
            amount: actualWalletUsed,
            description: `Used for order ${order.order_number || order.id}`,
          })
        }
      }

      // Decrease product stock
      for (const item of items) {
        if (item.variantId) {
          await supabase.rpc("decrease_variant_stock", {
            p_variant_id: item.variantId,
            p_quantity: item.quantity,
          })
        }
      }

      // Send confirmation email (non-blocking)
      try {
        await sendOrderConfirmationEmail({
          orderId: order.id,
          orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
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

      // Create Shiprocket shipment (non-blocking)
      try {
        const nameParts = shippingAddress.full_name.trim().split(" ")
        const firstName = nameParts[0] || "Customer"
        const lastName = nameParts.slice(1).join(" ") || ""

        const shiprocketItems = items.map((item) => ({
          name: item.name + (item.variantName ? ` - ${item.variantName}` : ""),
          sku: item.variantId || item.productId || "SKU-DEFAULT",
          units: item.quantity,
          selling_price: item.price,
        }))

        const shiprocketOrder: CreateShiprocketOrderRequest = {
          order_id: order.order_number || order.id,
          order_date: new Date().toISOString().split("T")[0],
          pickup_location: "Primary",
          billing_customer_name: firstName,
          billing_last_name: lastName,
          billing_address: shippingAddress.line1,
          billing_address_2: shippingAddress.line2 || "",
          billing_city: shippingAddress.city,
          billing_pincode: shippingAddress.pincode,
          billing_state: shippingAddress.state,
          billing_country: "India",
          billing_email: email,
          billing_phone: shippingAddress.phone,
          shipping_is_billing: true,
          order_items: shiprocketItems,
          payment_method: "COD",
          sub_total: subtotal,
          length: 20,
          breadth: 15,
          height: 10,
          weight: 0.5,
        }

        const shiprocketResponse = await shiprocketClient.createOrder(shiprocketOrder)

        // Update order with Shiprocket tracking details
        await supabase
          .from("orders")
          .update({
            shiprocket_order_id: shiprocketResponse.order_id?.toString(),
            shiprocket_shipment_id: shiprocketResponse.shipment_id?.toString(),
          })
          .eq("id", order.id)

        if (shiprocketResponse.awb_code) {
          await supabase
            .from("orders")
            .update({
              awb_number: shiprocketResponse.awb_code,
              courier_name: shiprocketResponse.courier_name,
            })
            .eq("id", order.id)
        }
      } catch (shiprocketError) {
        console.error("Shiprocket order creation error (non-fatal):", shiprocketError)
      }

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.order_number,
        paymentMethod: "cod",
        success: true,
      })
    }

    // ========================================================================
    // Prepaid Order Response
    // ========================================================================

    return NextResponse.json({
      orderId: order.id,
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
