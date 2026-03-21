/**
 * @fileoverview Order status notification emails — luxury branded templates.
 * Sends emails when order status changes (processing, shipped, delivered, cancelled, refunded).
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

interface OrderStatusEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  status: "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  trackingNumber?: string
  courierName?: string
  estimatedDelivery?: string
  refundAmount?: number
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alaire.in"

// ============================================================================
// Shared Template Shell
// ============================================================================

function buildEmail({
  accentColor,
  iconHtml,
  headline,
  subtext,
  orderNumber,
  bodyHtml,
  ctaText,
  ctaUrl,
}: {
  accentColor: string
  iconHtml: string
  headline: string
  subtext: string
  orderNumber: string
  bodyHtml: string
  ctaText: string
  ctaUrl: string
}): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f4ef; -webkit-font-smoothing: antialiased;">
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

              <!-- Card -->
              <tr>
                <td style="background-color: #ffffff; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                  <div style="height: 3px; background: ${accentColor};"></div>

                  <!-- Header -->
                  <div style="padding: 48px 40px 32px; text-align: center;">
                    <div style="width: 56px; height: 56px; margin: 0 auto 24px; border-radius: 50%; border: 2px solid ${accentColor}; line-height: 56px; text-align: center; font-size: 24px;">
                      ${iconHtml}
                    </div>
                    <h2 style="margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: normal; color: #1a1a1a; letter-spacing: 1px;">${headline}</h2>
                    <p style="margin: 0; font-family: -apple-system, sans-serif; font-size: 15px; color: #8a7e6b; line-height: 1.5;">
                      ${subtext}
                    </p>
                  </div>

                  <!-- Order Number -->
                  <div style="margin: 0 40px 32px; background-color: #faf8f4; border: 1px solid #f0ece4; padding: 16px 24px; text-align: center;">
                    <span style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8a7e6b;">Order Number</span>
                    <br>
                    <span style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; color: #1a1a1a; letter-spacing: 1px;">${orderNumber}</span>
                  </div>

                  <!-- Body Content -->
                  ${bodyHtml}

                  <!-- CTA -->
                  <div style="padding: 8px 40px 40px; text-align: center;">
                    <a href="${ctaUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 16px 48px; text-decoration: none; font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
                      ${ctaText}
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
}

// ============================================================================
// Processing Email
// ============================================================================

export async function sendOrderProcessingEmail(data: OrderStatusEmailData): Promise<boolean> {
  const customerName = escapeHtml(data.customerName.split(" ")[0])
  const orderNumber = escapeHtml(data.orderNumber)

  const html = buildEmail({
    accentColor: "linear-gradient(90deg, #c4a265, #dfc08a, #c4a265)",
    iconHtml: "&#9881;",
    headline: "We're On It",
    subtext: `${customerName}, your order is being carefully prepared and packed by our team.`,
    orderNumber,
    bodyHtml: `
      <div style="padding: 0 40px 32px;">
        <div style="background-color: #faf8f4; border: 1px solid #f0ece4; padding: 24px; border-radius: 2px;">
          <table style="width: 100%; font-family: -apple-system, sans-serif; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #8a7e6b; vertical-align: top; width: 24px;">01</td>
              <td style="padding: 8px 0 8px 12px; color: #1a1a1a;"><strong>Order received</strong> — confirmed and in our system</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #c4a265; vertical-align: top; font-weight: bold;">02</td>
              <td style="padding: 8px 0 8px 12px; color: #c4a265; font-weight: bold;">Processing — being packed with care</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #d1ccc3; vertical-align: top;">03</td>
              <td style="padding: 8px 0 8px 12px; color: #d1ccc3;">Shipped — on its way to you</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #d1ccc3; vertical-align: top;">04</td>
              <td style="padding: 8px 0 8px 12px; color: #d1ccc3;">Delivered — at your doorstep</td>
            </tr>
          </table>
        </div>
      </div>
    `,
    ctaText: "View Order",
    ctaUrl: `${siteUrl}/account/orders`,
  })

  try {
    await getResend().emails.send({
      from: "Alaire <orders@alaire.in>",
      to: data.customerEmail,
      subject: `Your Order ${orderNumber} is Being Prepared`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send processing email:", error)
    return false
  }
}

// ============================================================================
// Shipped Email
// ============================================================================

export async function sendOrderShippedEmail(data: OrderStatusEmailData): Promise<boolean> {
  const customerName = escapeHtml(data.customerName.split(" ")[0])
  const orderNumber = escapeHtml(data.orderNumber)

  let trackingHtml = ""
  if (data.trackingNumber) {
    trackingHtml = `
      <div style="padding: 0 40px 32px;">
        <div style="background-color: #f0f5ff; border: 1px solid #c7d9f5; padding: 24px; border-radius: 2px;">
          <span style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #4a7ab5; display: block; margin-bottom: 16px; font-weight: 600;">Tracking Details</span>
          <table style="width: 100%; font-family: -apple-system, sans-serif; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7e9e;">Courier</td>
              <td style="padding: 6px 0; text-align: right; color: #1a1a1a; font-weight: 600;">${escapeHtml(data.courierName || "Standard Delivery")}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7e9e;">Tracking No.</td>
              <td style="padding: 6px 0; text-align: right; color: #1a1a1a; font-weight: 600; font-family: monospace;">${escapeHtml(data.trackingNumber)}</td>
            </tr>
            ${data.estimatedDelivery ? `
            <tr>
              <td style="padding: 6px 0; color: #6b7e9e;">Est. Delivery</td>
              <td style="padding: 6px 0; text-align: right; color: #1a1a1a; font-weight: 600;">${escapeHtml(data.estimatedDelivery)}</td>
            </tr>
            ` : ""}
          </table>
        </div>
      </div>
    `
  }

  const html = buildEmail({
    accentColor: "linear-gradient(90deg, #4a7ab5, #6b9fd4, #4a7ab5)",
    iconHtml: "&#128230;",
    headline: "Your Order Has Shipped",
    subtext: `${customerName}, your package is on its way. We can't wait for you to receive it.`,
    orderNumber,
    bodyHtml: `
      ${trackingHtml}
      <div style="padding: 0 40px 32px;">
        <div style="background-color: #faf8f4; border: 1px solid #f0ece4; padding: 24px; border-radius: 2px;">
          <table style="width: 100%; font-family: -apple-system, sans-serif; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #8a7e6b; vertical-align: top; width: 24px;">01</td>
              <td style="padding: 8px 0 8px 12px; color: #8a7e6b;">Order received</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8a7e6b; vertical-align: top;">02</td>
              <td style="padding: 8px 0 8px 12px; color: #8a7e6b;">Packed and ready</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a7ab5; vertical-align: top; font-weight: bold;">03</td>
              <td style="padding: 8px 0 8px 12px; color: #4a7ab5; font-weight: bold;">Shipped — in transit</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #d1ccc3; vertical-align: top;">04</td>
              <td style="padding: 8px 0 8px 12px; color: #d1ccc3;">Delivered</td>
            </tr>
          </table>
        </div>
      </div>
    `,
    ctaText: "Track Your Package",
    ctaUrl: `${siteUrl}/account/orders`,
  })

  try {
    await getResend().emails.send({
      from: "Alaire <orders@alaire.in>",
      to: data.customerEmail,
      subject: `Your Alaire Order ${orderNumber} Has Shipped`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send shipped email:", error)
    return false
  }
}

// ============================================================================
// Delivered Email
// ============================================================================

export async function sendOrderDeliveredEmail(data: OrderStatusEmailData): Promise<boolean> {
  const customerName = escapeHtml(data.customerName.split(" ")[0])
  const orderNumber = escapeHtml(data.orderNumber)

  const html = buildEmail({
    accentColor: "linear-gradient(90deg, #5a8f5a, #7ab87a, #5a8f5a)",
    iconHtml: "&#10003;",
    headline: "Your Order Has Arrived",
    subtext: `${customerName}, your Alaire order has been delivered. We hope you love every piece.`,
    orderNumber,
    bodyHtml: `
      <div style="padding: 0 40px 32px;">
        <!-- Review Card -->
        <div style="background-color: #faf8f4; border: 1px solid #f0ece4; padding: 28px; border-radius: 2px; text-align: center;">
          <span style="font-family: Georgia, serif; font-size: 18px; color: #1a1a1a; display: block; margin-bottom: 8px;">We'd love your feedback</span>
          <p style="margin: 0 0 20px; font-family: -apple-system, sans-serif; font-size: 14px; color: #8a7e6b; line-height: 1.5;">
            Your thoughts help us improve and help others discover Alaire. Share your experience?
          </p>
          <a href="${siteUrl}/account/orders" style="display: inline-block; background-color: #c4a265; color: #ffffff; padding: 12px 36px; text-decoration: none; font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
            Write a Review
          </a>
        </div>
      </div>

      <div style="padding: 0 40px 32px;">
        <span style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8a7e6b; display: block; margin-bottom: 12px; font-weight: 600;">Good to Know</span>
        <table style="width: 100%; font-family: -apple-system, sans-serif; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #8a7e6b;">&#8226;&nbsp; Returns accepted within 7 days of delivery</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8a7e6b;">&#8226;&nbsp; Download your invoice from order details</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8a7e6b;">&#8226;&nbsp; Reach out for any concerns — we're here for you</td>
          </tr>
        </table>
      </div>
    `,
    ctaText: "Continue Shopping",
    ctaUrl: `${siteUrl}/products`,
  })

  try {
    await getResend().emails.send({
      from: "Alaire <orders@alaire.in>",
      to: data.customerEmail,
      subject: `Your Alaire Order ${orderNumber} Has Been Delivered`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send delivered email:", error)
    return false
  }
}

// ============================================================================
// Cancelled Email
// ============================================================================

export async function sendOrderCancelledEmail(data: OrderStatusEmailData): Promise<boolean> {
  const customerName = escapeHtml(data.customerName.split(" ")[0])
  const orderNumber = escapeHtml(data.orderNumber)

  const html = buildEmail({
    accentColor: "linear-gradient(90deg, #9e6b6b, #c48a8a, #9e6b6b)",
    iconHtml: "&#10005;",
    headline: "Order Cancelled",
    subtext: `${customerName}, your order has been cancelled as requested.`,
    orderNumber,
    bodyHtml: `
      <div style="padding: 0 40px 32px;">
        <div style="background-color: #faf8f4; border: 1px solid #f0ece4; padding: 24px; border-radius: 2px;">
          <p style="margin: 0; font-family: -apple-system, sans-serif; font-size: 14px; color: #1a1a1a; line-height: 1.7;">
            If you made a payment for this order, your refund will be automatically processed and credited back to your original payment method or wallet within 5–7 business days.
          </p>
          <p style="margin: 16px 0 0; font-family: -apple-system, sans-serif; font-size: 14px; color: #8a7e6b; line-height: 1.7;">
            We're sorry to see this order go. If there's anything we can do differently, please don't hesitate to let us know.
          </p>
        </div>
      </div>
    `,
    ctaText: "Shop Again",
    ctaUrl: `${siteUrl}/products`,
  })

  try {
    await getResend().emails.send({
      from: "Alaire <orders@alaire.in>",
      to: data.customerEmail,
      subject: `Order ${orderNumber} Has Been Cancelled`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send cancelled email:", error)
    return false
  }
}

// ============================================================================
// Refund Email
// ============================================================================

export async function sendOrderRefundEmail(data: OrderStatusEmailData): Promise<boolean> {
  const customerName = escapeHtml(data.customerName.split(" ")[0])
  const orderNumber = escapeHtml(data.orderNumber)

  const html = buildEmail({
    accentColor: "linear-gradient(90deg, #5a8f5a, #7ab87a, #5a8f5a)",
    iconHtml: "&#8377;",
    headline: "Refund Processed",
    subtext: `${customerName}, we've processed your refund. Here are the details.`,
    orderNumber,
    bodyHtml: `
      ${data.refundAmount ? `
      <div style="padding: 0 40px 32px;">
        <div style="background-color: #f0faf0; border: 1px solid #c7e8c7; padding: 28px; border-radius: 2px; text-align: center;">
          <span style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #5a8f5a; display: block; margin-bottom: 8px; font-weight: 600;">Refund Amount</span>
          <span style="font-family: Georgia, serif; font-size: 32px; font-weight: bold; color: #2d6b2d;">${formatPrice(data.refundAmount)}</span>
        </div>
      </div>
      ` : ""}

      <div style="padding: 0 40px 32px;">
        <span style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8a7e6b; display: block; margin-bottom: 12px; font-weight: 600;">What to Expect</span>
        <table style="width: 100%; font-family: -apple-system, sans-serif; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #8a7e6b;">&#8226;&nbsp; Refund credited to your original payment method</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8a7e6b;">&#8226;&nbsp; Bank processing takes 5–7 business days</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8a7e6b;">&#8226;&nbsp; Wallet credits are reflected instantly</td>
          </tr>
        </table>
      </div>
    `,
    ctaText: "View Order Details",
    ctaUrl: `${siteUrl}/account/orders`,
  })

  try {
    await getResend().emails.send({
      from: "Alaire <orders@alaire.in>",
      to: data.customerEmail,
      subject: `Refund Processed — Order ${orderNumber}`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send refund email:", error)
    return false
  }
}
