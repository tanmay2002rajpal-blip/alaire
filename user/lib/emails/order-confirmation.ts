/**
 * @fileoverview Order confirmation email — luxury branded template.
 * Sends beautiful transactional emails using Resend.
 *
 * @module lib/emails/order-confirmation
 */

import { Resend } from "resend"

// ============================================================================
// Helpers
// ============================================================================

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ============================================================================
// Types
// ============================================================================

interface OrderItem {
  product_name: string
  variant_name?: string
  quantity: number
  price: number
}

interface OrderEmailData {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  walletUsed: number
  total: number
  shippingAddress: {
    full_name: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  paymentMethod: string
}

// ============================================================================
// Email Function
// ============================================================================

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

  const safeCustomerName = escapeHtml(customerName.split(" ")[0])
  const safeOrderNumber = escapeHtml(orderNumber)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alaire.in"

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f0ece4;">
          <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; color: #1a1a1a; display: block;">${escapeHtml(item.product_name)}</span>
          ${item.variant_name ? `<span style="font-size: 13px; color: #8a7e6b; display: block; margin-top: 3px;">${escapeHtml(item.variant_name)}</span>` : ""}
          <span style="font-size: 13px; color: #8a7e6b; display: block; margin-top: 3px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 16px 0; border-bottom: 1px solid #f0ece4; text-align: right; vertical-align: top;">
          <span style="font-family: Georgia, serif; font-size: 15px; color: #1a1a1a;">${formatPrice(item.price * item.quantity)}</span>
        </td>
      </tr>
    `
    )
    .join("")

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmed</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f4ef; -webkit-font-smoothing: antialiased;">
      <!-- Outer wrapper -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f4ef;">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

              <!-- Logo -->
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: normal; letter-spacing: 6px; color: #1a1a1a;">ALAIRE</h1>
                </td>
              </tr>

              <!-- Main Card -->
              <tr>
                <td style="background-color: #ffffff; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">

                  <!-- Gold Accent Bar -->
                  <div style="height: 3px; background: linear-gradient(90deg, #c4a265, #dfc08a, #c4a265);"></div>

                  <!-- Confirmation Header -->
                  <div style="padding: 48px 40px 32px; text-align: center;">
                    <div style="width: 56px; height: 56px; margin: 0 auto 24px; border-radius: 50%; border: 2px solid #c4a265; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 24px; line-height: 56px;">&#10003;</span>
                    </div>
                    <h2 style="margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: normal; color: #1a1a1a; letter-spacing: 1px;">Order Confirmed</h2>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #8a7e6b; line-height: 1.5;">
                      Thank you, ${safeCustomerName}. Your order has been received<br>and is being prepared with care.
                    </p>
                  </div>

                  <!-- Order Number -->
                  <div style="margin: 0 40px 32px; background-color: #faf8f4; border: 1px solid #f0ece4; padding: 16px 24px; text-align: center;">
                    <span style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8a7e6b;">Order Number</span>
                    <br>
                    <span style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; color: #1a1a1a; letter-spacing: 1px;">${safeOrderNumber}</span>
                  </div>

                  <!-- Divider -->
                  <div style="margin: 0 40px; height: 1px; background-color: #f0ece4;"></div>

                  <!-- Items -->
                  <div style="padding: 32px 40px;">
                    <h3 style="margin: 0 0 20px; font-family: Georgia, serif; font-size: 16px; font-weight: normal; color: #1a1a1a; letter-spacing: 1px; text-transform: uppercase;">Your Items</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      ${itemsHtml}
                    </table>
                  </div>

                  <!-- Price Summary -->
                  <div style="padding: 0 40px 32px;">
                    <table style="width: 100%; font-family: -apple-system, sans-serif; font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #8a7e6b;">Subtotal</td>
                        <td style="padding: 6px 0; text-align: right; color: #1a1a1a;">${formatPrice(subtotal)}</td>
                      </tr>
                      ${discount > 0 ? `
                      <tr>
                        <td style="padding: 6px 0; color: #5a8f5a;">Discount</td>
                        <td style="padding: 6px 0; text-align: right; color: #5a8f5a;">-${formatPrice(discount)}</td>
                      </tr>
                      ` : ""}
                      <tr>
                        <td style="padding: 6px 0; color: #8a7e6b;">Shipping</td>
                        <td style="padding: 6px 0; text-align: right; color: #1a1a1a;">${shipping > 0 ? formatPrice(shipping) : "Complimentary"}</td>
                      </tr>
                      ${walletUsed > 0 ? `
                      <tr>
                        <td style="padding: 6px 0; color: #5a8f5a;">Wallet Credit</td>
                        <td style="padding: 6px 0; text-align: right; color: #5a8f5a;">-${formatPrice(walletUsed)}</td>
                      </tr>
                      ` : ""}
                      <tr>
                        <td colspan="2" style="padding: 12px 0 0;"><div style="height: 2px; background-color: #1a1a1a;"></div></td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 0; font-family: Georgia, serif; font-size: 18px; font-weight: bold; color: #1a1a1a;">Total</td>
                        <td style="padding: 12px 0 0; text-align: right; font-family: Georgia, serif; font-size: 18px; font-weight: bold; color: #1a1a1a;">${formatPrice(total)}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Divider -->
                  <div style="margin: 0 40px; height: 1px; background-color: #f0ece4;"></div>

                  <!-- Shipping & Payment Grid -->
                  <div style="padding: 32px 40px;">
                    <table style="width: 100%;">
                      <tr>
                        <td style="vertical-align: top; width: 50%; padding-right: 16px;">
                          <span style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8a7e6b; display: block; margin-bottom: 10px;">Delivering To</span>
                          <span style="font-family: -apple-system, sans-serif; font-size: 14px; color: #1a1a1a; line-height: 1.6; display: block;">
                            <strong>${escapeHtml(shippingAddress.full_name)}</strong><br>
                            ${escapeHtml(shippingAddress.line1)}<br>
                            ${shippingAddress.line2 ? `${escapeHtml(shippingAddress.line2)}<br>` : ""}
                            ${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.state)}<br>
                            ${escapeHtml(shippingAddress.pincode)}
                          </span>
                        </td>
                        <td style="vertical-align: top; width: 50%; padding-left: 16px;">
                          <span style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8a7e6b; display: block; margin-bottom: 10px;">Payment</span>
                          <span style="font-family: -apple-system, sans-serif; font-size: 14px; color: #1a1a1a; display: block;">${escapeHtml(paymentMethod)}</span>
                          <span style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8a7e6b; display: block; margin-top: 20px; margin-bottom: 10px;">Estimated Delivery</span>
                          <span style="font-family: -apple-system, sans-serif; font-size: 14px; color: #1a1a1a; display: block;">5–7 business days</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA -->
                  <div style="padding: 8px 40px 40px; text-align: center;">
                    <a href="${siteUrl}/account/orders" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 16px 48px; text-decoration: none; font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
                      Track Your Order
                    </a>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 20px; text-align: center;">
                  <p style="margin: 0 0 8px; font-family: -apple-system, sans-serif; font-size: 13px; color: #8a7e6b;">
                    Need help? Reach us at <a href="mailto:support@alaire.in" style="color: #c4a265; text-decoration: none;">support@alaire.in</a>
                  </p>
                  <p style="margin: 0; font-family: -apple-system, sans-serif; font-size: 12px; color: #b8ad9e;">
                    &copy; ${new Date().getFullYear()} Alaire. Crafted with intention.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    await getResend().emails.send({
      from: "Alaire <orders@alaire.in>",
      to: customerEmail,
      subject: `Your Alaire Order is Confirmed — ${safeOrderNumber}`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send order confirmation email:", error)
    return false
  }
}
