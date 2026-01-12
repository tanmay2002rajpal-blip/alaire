/**
 * @fileoverview Verify Payment API endpoint.
 * Handles Razorpay payment verification and order fulfillment.
 *
 * Flow:
 * 1. Verify Razorpay signature using HMAC-SHA256
 * 2. Update order status to "paid"
 * 3. Deduct wallet balance if used
 * 4. Record order status history
 * 5. Send order confirmation email
 * 6. Decrease product stock
 * 7. Create Shiprocket shipment
 *
 * Security:
 * - Signature verification prevents payment fraud
 * - Only processes orders with valid Razorpay signatures
 *
 * @module app/api/checkout/verify-payment
 */

import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { shiprocketClient } from "@/lib/shiprocket/client"
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation"
import { verifyPaymentSchema, validateRequest, type VerifyPaymentInput } from "@/lib/validations/api"
import type { CreateShiprocketOrderRequest } from "@/lib/shiprocket/types"

// ============================================================================
// Types
// ============================================================================

interface OrderItemData {
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  price: number
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/checkout/verify-payment
 *
 * Verifies a Razorpay payment and completes the order fulfillment process.
 * This endpoint is called after successful payment on the client side.
 *
 * Security Note:
 * The signature verification is critical - it ensures the payment
 * callback is authentic and wasn't tampered with.
 *
 * @param request - HTTP request with VerifyPaymentRequest body
 * @returns Success confirmation or error message
 *
 * @example
 * ```ts
 * // Client-side after Razorpay checkout success
 * const response = await fetch('/api/checkout/verify-payment', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     orderId: 'uuid-here',
 *     razorpay_payment_id: 'pay_xxx',
 *     razorpay_order_id: 'order_xxx',
 *     razorpay_signature: 'signature_xxx',
 *   }),
 * })
 * if (response.ok) {
 *   router.push('/order-success')
 * }
 * ```
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
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

    // Generate expected signature using HMAC-SHA256
    // Format: razorpay_order_id|razorpay_payment_id
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

    const supabase = await createClient()

    // ========================================================================
    // Fetch Order Details
    // ========================================================================

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        email,
        wallet_amount_used,
        order_number,
        subtotal,
        discount_amount,
        shipping_amount,
        total,
        payment_method,
        shipping_address,
        items:order_items(
          product_id,
          variant_id,
          product_name,
          variant_name,
          quantity,
          price
        )
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.error("Order fetch error:", orderError)
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      )
    }

    // ========================================================================
    // Update Order Status
    // ========================================================================

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      console.error("Order update error:", updateError)
      return NextResponse.json(
        { message: "Failed to update order" },
        { status: 500 }
      )
    }

    // ========================================================================
    // Wallet Balance Deduction
    // ========================================================================

    if (order.wallet_amount_used > 0 && order.user_id) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", order.user_id)
        .single()

      if (wallet) {
        // Deduct wallet balance
        await supabase
          .from("wallets")
          .update({ balance: wallet.balance - order.wallet_amount_used })
          .eq("id", wallet.id)

        // Record wallet transaction
        await supabase.from("wallet_transactions").insert({
          wallet_id: wallet.id,
          type: "debit",
          amount: order.wallet_amount_used,
          description: `Used for order ${order.order_number || orderId}`,
        })
      }
    }

    // ========================================================================
    // Order Status History
    // ========================================================================

    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: "paid",
      note: `Payment received via Razorpay (${razorpay_payment_id})${
        order.wallet_amount_used > 0 ? ` + ₹${order.wallet_amount_used} from wallet` : ""
      }`,
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

      if (shippingAddress && order.items) {
        await sendOrderConfirmationEmail({
          orderId: orderId,
          orderNumber: order.order_number || orderId.slice(0, 8).toUpperCase(),
          customerName: shippingAddress.full_name,
          customerEmail: order.email,
          items: order.items.map((item: OrderItemData) => ({
            product_name: item.product_name,
            variant_name: item.variant_name,
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
      // Log but don't fail - email is not critical to payment success
      console.error("Order confirmation email failed (non-fatal):", emailError)
    }

    // ========================================================================
    // Stock Reduction
    // ========================================================================

    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.variant_id) {
          await supabase.rpc("decrease_variant_stock", {
            p_variant_id: item.variant_id,
            p_quantity: item.quantity,
          })
        }
      }
    }

    // ========================================================================
    // Shiprocket Shipment Creation (Non-blocking)
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

      if (shippingAddress && order.items && order.items.length > 0) {
        // Parse customer name
        const nameParts = shippingAddress.full_name.trim().split(' ')
        const firstName = nameParts[0] || 'Customer'
        const lastName = nameParts.slice(1).join(' ') || ''

        // Transform order items for Shiprocket
        const shiprocketItems = order.items.map((item: OrderItemData) => ({
          name: item.product_name + (item.variant_name ? ` - ${item.variant_name}` : ''),
          sku: item.variant_id || item.product_id || 'SKU-DEFAULT',
          units: item.quantity,
          selling_price: item.price,
        }))

        const shiprocketOrder: CreateShiprocketOrderRequest = {
          order_id: order.order_number || orderId,
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: 'Primary',
          billing_customer_name: firstName,
          billing_last_name: lastName,
          billing_address: shippingAddress.line1,
          billing_address_2: shippingAddress.line2 || '',
          billing_city: shippingAddress.city,
          billing_pincode: shippingAddress.pincode,
          billing_state: shippingAddress.state,
          billing_country: 'India',
          billing_email: order.email,
          billing_phone: shippingAddress.phone,
          shipping_is_billing: true,
          order_items: shiprocketItems,
          payment_method: 'Prepaid',
          sub_total: order.subtotal,
          // Default package dimensions (should be configured per product)
          length: 20,
          breadth: 15,
          height: 10,
          weight: 0.5,
        }

        const shiprocketResponse = await shiprocketClient.createOrder(shiprocketOrder)

        // Save Shiprocket tracking IDs
        await supabase
          .from("orders")
          .update({
            shiprocket_order_id: shiprocketResponse.order_id?.toString(),
            shiprocket_shipment_id: shiprocketResponse.shipment_id?.toString(),
          })
          .eq("id", orderId)

        // Save AWB if auto-assigned by courier
        if (shiprocketResponse.awb_code) {
          await supabase
            .from("orders")
            .update({
              awb_number: shiprocketResponse.awb_code,
              courier_name: shiprocketResponse.courier_name,
            })
            .eq("id", orderId)
        }

        console.log(`Shiprocket order created: ${shiprocketResponse.order_id}`)
      }
    } catch (shiprocketError) {
      // Log but don't fail - Shiprocket is not critical to payment verification
      console.error("Shiprocket order creation error (non-fatal):", shiprocketError)
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
