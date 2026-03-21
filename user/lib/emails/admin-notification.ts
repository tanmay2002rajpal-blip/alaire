/**
 * @fileoverview Admin notification emails for new orders.
 * Sends notification to admin when a new order is placed.
 */

import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const ADMIN_EMAIL = "tanmay2002rajpal@gmail.com"

interface AdminOrderNotificationData {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: {
    product_name: string
    variant_name?: string
    quantity: number
    price: number
  }[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  paymentMethod: string
  shippingAddress: {
    full_name: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    phone: string
  }
}

export async function sendAdminOrderNotification(data: AdminOrderNotificationData): Promise<boolean> {
  const {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    items,
    subtotal,
    discount,
    shipping,
    total,
    paymentMethod,
    shippingAddress,
  } = data

  const safeOrderNumber = escapeHtml(orderNumber)
  const safeCustomerName = escapeHtml(customerName)

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${escapeHtml(item.product_name)}${item.variant_name ? `<br><span style="color: #6b7280; font-size: 12px;">${escapeHtml(item.variant_name)}</span>` : ""}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `
    )
    .join("")

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f3f4f6;">
      <div style="background-color: #ffffff; padding: 32px 24px; border-radius: 8px; margin: 16px;">
        <!-- Header -->
        <div style="background-color: #000; color: #fff; padding: 20px 24px; margin: -32px -24px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 3px;">ALAIRE — NEW ORDER</h1>
        </div>

        <!-- Order Badge -->
        <div style="background-color: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
          <table style="width: 100%;">
            <tr>
              <td>
                <span style="font-size: 12px; color: #059669; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">New Order Received</span>
                <br>
                <span style="font-size: 20px; font-weight: 700; color: #065f46;">${safeOrderNumber}</span>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 24px; font-weight: 700; color: #065f46;">${formatPrice(total)}</span>
                <br>
                <span style="font-size: 12px; color: #059669; background: #d1fae5; padding: 2px 8px; border-radius: 4px;">${escapeHtml(paymentMethod)}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Customer Info -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 12px; font-weight: 600;">Customer</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #6b7280; width: 80px;">Name</td>
              <td style="padding: 4px 0; font-weight: 600;">${safeCustomerName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Email</td>
              <td style="padding: 4px 0;"><a href="mailto:${escapeHtml(customerEmail)}" style="color: #2563eb;">${escapeHtml(customerEmail)}</a></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Phone</td>
              <td style="padding: 4px 0;"><a href="tel:${escapeHtml(customerPhone)}" style="color: #2563eb;">${escapeHtml(customerPhone)}</a></td>
            </tr>
          </table>
        </div>

        <!-- Items -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 12px; font-weight: 600;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Product</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Subtotal</td>
              <td style="padding: 4px 0; text-align: right;">${formatPrice(subtotal)}</td>
            </tr>
            ${discount > 0 ? `
            <tr>
              <td style="padding: 4px 0; color: #059669;">Discount</td>
              <td style="padding: 4px 0; text-align: right; color: #059669;">-${formatPrice(discount)}</td>
            </tr>` : ""}
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Shipping</td>
              <td style="padding: 4px 0; text-align: right;">${shipping > 0 ? formatPrice(shipping) : "Free"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0 0; font-weight: 700; font-size: 16px; border-top: 2px solid #000;">Total</td>
              <td style="padding: 8px 0 0; text-align: right; font-weight: 700; font-size: 16px; border-top: 2px solid #000;">${formatPrice(total)}</td>
            </tr>
          </table>
        </div>

        <!-- Shipping Address -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 12px; font-weight: 600;">Ship To</h3>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6;">
            <strong>${escapeHtml(shippingAddress.full_name)}</strong><br>
            ${escapeHtml(shippingAddress.line1)}<br>
            ${shippingAddress.line2 ? `${escapeHtml(shippingAddress.line2)}<br>` : ""}
            ${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.state)} ${escapeHtml(shippingAddress.pincode)}<br>
            Phone: ${escapeHtml(shippingAddress.phone)}
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://alaire.in"}/admin/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 32px; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 1px; border-radius: 6px;">
            VIEW IN ADMIN
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 24px; margin-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Alaire Admin Notification &mdash; ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await getResend().emails.send({
      from: "Alaire Orders <admin@alaire.in>",
      to: ADMIN_EMAIL,
      subject: `New Order ${safeOrderNumber} — ${formatPrice(total)} (${paymentMethod})`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send admin notification email:", error)
    return false
  }
}
