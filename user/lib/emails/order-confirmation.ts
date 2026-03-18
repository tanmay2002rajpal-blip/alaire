/**
 * @fileoverview Order confirmation email functionality.
 * Sends branded transactional emails using Resend.
 *
 * Email Design:
 * - Clean, minimal layout matching Alaire brand
 * - Serif typography (Georgia) for luxury feel
 * - Clear order summary with itemized breakdown
 * - Prominent CTA to view order status
 *
 * @module lib/emails/order-confirmation
 *
 * @example
 * ```ts
 * import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation"
 *
 * await sendOrderConfirmationEmail({
 *   orderId: "uuid",
 *   orderNumber: "ORD-12345",
 *   customerName: "John Doe",
 *   customerEmail: "john@example.com",
 *   items: [...],
 *   subtotal: 1999,
 *   discount: 200,
 *   shipping: 50,
 *   walletUsed: 100,
 *   total: 1749,
 *   shippingAddress: {...},
 *   paymentMethod: "Prepaid (Razorpay)",
 * })
 * ```
 */

import { Resend } from "resend"

// ============================================================================
// Helpers
// ============================================================================

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ============================================================================
// Configuration
// ============================================================================

/** Lazily create Resend email client to avoid build-time errors */
function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

// ============================================================================
// Types
// ============================================================================

/**
 * Individual order line item for email display.
 */
interface OrderItem {
  /** Product name */
  product_name: string
  /** Variant description (size, color) */
  variant_name?: string
  /** Quantity ordered */
  quantity: number
  /** Unit price */
  price: number
}

/**
 * Complete data required to send order confirmation email.
 */
interface OrderEmailData {
  /** Internal order UUID */
  orderId: string
  /** Display order number (e.g., "ORD-12345") */
  orderNumber: string
  /** Customer's name for greeting */
  customerName: string
  /** Customer's email address */
  customerEmail: string
  /** Ordered items with details */
  items: OrderItem[]
  /** Cart subtotal before discounts */
  subtotal: number
  /** Discount amount applied */
  discount: number
  /** Shipping charge */
  shipping: number
  /** Wallet credit applied */
  walletUsed: number
  /** Final order total */
  total: number
  /** Delivery address */
  shippingAddress: {
    full_name: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  /** Payment method description */
  paymentMethod: string
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Formats amount as Indian Rupees for email display.
 *
 * @param amount - Amount to format
 * @returns Formatted price string (e.g., "₹1,999")
 */
function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ============================================================================
// Email Function
// ============================================================================

/**
 * Sends an order confirmation email to the customer.
 *
 * Email includes:
 * - Order confirmation header with checkmark
 * - Order number prominently displayed
 * - Itemized list of products with quantities
 * - Price breakdown (subtotal, discount, shipping, wallet, total)
 * - Shipping address details
 * - Payment method confirmation
 * - CTA button to view order in account
 *
 * @param data - Order data for email content
 * @returns True if email sent successfully, false otherwise
 *
 * @example
 * ```ts
 * const success = await sendOrderConfirmationEmail({
 *   orderId: "abc-123",
 *   orderNumber: "ORD-12345",
 *   customerName: "Priya",
 *   customerEmail: "priya@example.com",
 *   items: [
 *     { product_name: "Silk Dress", variant_name: "M / Blue", quantity: 1, price: 2999 }
 *   ],
 *   subtotal: 2999,
 *   discount: 0,
 *   shipping: 0,
 *   walletUsed: 0,
 *   total: 2999,
 *   shippingAddress: { ... },
 *   paymentMethod: "Prepaid (Razorpay)",
 * })
 * ```
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const {
    orderNumber,
    customerName,
    customerEmail,
    items,
    subtotal,
    discount,
    shipping,
    walletUsed,
    total,
    shippingAddress,
    paymentMethod,
  } = data

  // Escape user-supplied values
  const safeCustomerName = escapeHtml(customerName)
  const safeOrderNumber = escapeHtml(orderNumber)

  // Build HTML table rows for order items
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <strong>${escapeHtml(item.product_name)}</strong>
          ${item.variant_name ? `<br><span style="color: #666; font-size: 14px;">${escapeHtml(item.variant_name)}</span>` : ""}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `
    )
    .join("")

  // Complete HTML email template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 40px 30px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 32px; font-weight: normal; letter-spacing: 4px; margin: 0;">ALAIRE</h1>
        </div>

        <!-- Order Confirmed -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 30px;">✓</span>
          </div>
          <h2 style="font-size: 24px; font-weight: normal; margin: 0 0 10px;">Order Confirmed</h2>
          <p style="color: #666; margin: 0;">Thank you for your order, ${safeCustomerName}!</p>
        </div>

        <!-- Order Number -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin-bottom: 30px;">
          <p style="margin: 0 0 5px; color: #666; font-size: 14px;">Order Number</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">${safeOrderNumber}</p>
        </div>

        <!-- Order Items -->
        <h3 style="font-size: 18px; font-weight: normal; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 10px; font-weight: normal; color: #666;">Item</th>
              <th style="text-align: center; padding-bottom: 10px; font-weight: normal; color: #666;">Qty</th>
              <th style="text-align: right; padding-bottom: 10px; font-weight: normal; color: #666;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Order Summary -->
        <div style="margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #666;">Subtotal</span>
            <span>${formatPrice(subtotal)}</span>
          </div>
          ${discount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #22c55e;">
            <span>Discount</span>
            <span>-${formatPrice(discount)}</span>
          </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #666;">Shipping</span>
            <span>${shipping > 0 ? formatPrice(shipping) : "Free"}</span>
          </div>
          ${walletUsed > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #22c55e;">
            <span>Wallet Applied</span>
            <span>-${formatPrice(walletUsed)}</span>
          </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #000; margin-top: 10px; font-size: 18px;">
            <strong>Total</strong>
            <strong>${formatPrice(total)}</strong>
          </div>
        </div>

        <!-- Shipping Address -->
        <h3 style="font-size: 18px; font-weight: normal; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">Shipping Address</h3>
        <div style="margin-bottom: 30px; line-height: 1.6;">
          <p style="margin: 0; font-weight: bold;">${escapeHtml(shippingAddress.full_name)}</p>
          <p style="margin: 5px 0; color: #666;">
            ${escapeHtml(shippingAddress.line1)}<br>
            ${shippingAddress.line2 ? `${escapeHtml(shippingAddress.line2)}<br>` : ""}
            ${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.state)} ${escapeHtml(shippingAddress.pincode)}<br>
            Phone: ${escapeHtml(shippingAddress.phone)}
          </p>
        </div>

        <!-- Payment Method -->
        <div style="background-color: #f5f5f5; padding: 15px 20px; margin-bottom: 30px;">
          <p style="margin: 0; color: #666; font-size: 14px;">Payment Method</p>
          <p style="margin: 5px 0 0; font-weight: bold;">${paymentMethod}</p>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 15px 40px; text-decoration: none; font-size: 14px; letter-spacing: 1px;">
            VIEW ORDER
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 30px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
            Questions? Contact us at <a href="mailto:support@alaire.in" style="color: #000;">support@alaire.in</a>
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Alaire. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await getResend().emails.send({
      from: "Alaire <orders@omrajpal.tech>",
      to: customerEmail,
      subject: `Order Confirmed - ${orderNumber}`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send order confirmation email:", error)
    return false
  }
}
