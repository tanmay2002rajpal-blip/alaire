/**
 * @fileoverview Order status notification emails.
 * Sends emails when order status changes (shipped, delivered, etc.)
 */

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderStatusEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  status: "shipped" | "delivered" | "cancelled" | "refunded"
  trackingNumber?: string
  courierName?: string
  estimatedDelivery?: string
  refundAmount?: number
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Sends order shipped notification email.
 */
export async function sendOrderShippedEmail(data: OrderStatusEmailData): Promise<boolean> {
  const { orderNumber, customerName, customerEmail, trackingNumber, courierName, estimatedDelivery } = data

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

        <!-- Shipped Icon -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 60px; height: 60px; background-color: #3b82f6; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 30px;">📦</span>
          </div>
          <h2 style="font-size: 24px; font-weight: normal; margin: 0 0 10px;">Your Order Has Shipped!</h2>
          <p style="color: #666; margin: 0;">Great news, ${customerName}! Your order is on its way.</p>
        </div>

        <!-- Order Details -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin-bottom: 30px;">
          <p style="margin: 0 0 5px; color: #666; font-size: 14px;">Order Number</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">${orderNumber}</p>
        </div>

        <!-- Tracking Information -->
        ${trackingNumber ? `
        <div style="background-color: #eff6ff; border: 1px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
          <h3 style="font-size: 16px; margin: 0 0 15px; color: #1d4ed8;">Tracking Information</h3>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 5px 0; color: #666;">Courier Partner:</td>
              <td style="padding: 5px 0; font-weight: bold; text-align: right;">${courierName || "Standard Delivery"}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Tracking Number:</td>
              <td style="padding: 5px 0; font-weight: bold; text-align: right;">${trackingNumber}</td>
            </tr>
            ${estimatedDelivery ? `
            <tr>
              <td style="padding: 5px 0; color: #666;">Estimated Delivery:</td>
              <td style="padding: 5px 0; font-weight: bold; text-align: right;">${estimatedDelivery}</td>
            </tr>
            ` : ""}
          </table>
        </div>
        ` : ""}

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 15px 40px; text-decoration: none; font-size: 14px; letter-spacing: 1px;">
            TRACK ORDER
          </a>
        </div>

        <!-- What's Next -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 16px; margin-bottom: 15px;">What's Next?</h3>
          <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
            <li>Your package is being handled with care</li>
            <li>You'll receive updates as it moves through transit</li>
            <li>We'll notify you when it's delivered</li>
          </ul>
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
    await resend.emails.send({
      from: "Alaire <orders@alaire.in>",
      to: customerEmail,
      subject: `Your Order ${orderNumber} Has Shipped! 📦`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send order shipped email:", error)
    return false
  }
}

/**
 * Sends order delivered notification email.
 */
export async function sendOrderDeliveredEmail(data: OrderStatusEmailData): Promise<boolean> {
  const { orderNumber, customerName, customerEmail } = data

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

        <!-- Delivered Icon -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 30px;">✓</span>
          </div>
          <h2 style="font-size: 24px; font-weight: normal; margin: 0 0 10px;">Order Delivered!</h2>
          <p style="color: #666; margin: 0;">Your order has been delivered, ${customerName}!</p>
        </div>

        <!-- Order Details -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin-bottom: 30px;">
          <p style="margin: 0 0 5px; color: #666; font-size: 14px;">Order Number</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">${orderNumber}</p>
        </div>

        <!-- Review Request -->
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 8px; text-align: center;">
          <h3 style="font-size: 16px; margin: 0 0 10px; color: #92400e;">How was your experience?</h3>
          <p style="color: #78350f; margin: 0 0 15px; font-size: 14px;">
            We'd love to hear your feedback! Leave a review and help other customers.
          </p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/orders" style="display: inline-block; background-color: #f59e0b; color: #fff; padding: 12px 30px; text-decoration: none; font-size: 14px; border-radius: 4px;">
            LEAVE A REVIEW
          </a>
        </div>

        <!-- Need Help? -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 16px; margin-bottom: 15px;">Need Help?</h3>
          <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
            <li>Returns accepted within 7 days of delivery</li>
            <li>Contact support for any issues with your order</li>
            <li>Download invoice from your order details page</li>
          </ul>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/products" style="display: inline-block; background-color: #000; color: #fff; padding: 15px 40px; text-decoration: none; font-size: 14px; letter-spacing: 1px;">
            SHOP MORE
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 30px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
            Thank you for shopping with us!
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
    await resend.emails.send({
      from: "Alaire <orders@alaire.in>",
      to: customerEmail,
      subject: `Your Order ${orderNumber} Has Been Delivered! ✓`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send order delivered email:", error)
    return false
  }
}

/**
 * Sends order refund notification email.
 */
export async function sendOrderRefundEmail(data: OrderStatusEmailData): Promise<boolean> {
  const { orderNumber, customerName, customerEmail, refundAmount } = data

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

        <!-- Refund Icon -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 30px;">💰</span>
          </div>
          <h2 style="font-size: 24px; font-weight: normal; margin: 0 0 10px;">Refund Processed</h2>
          <p style="color: #666; margin: 0;">Your refund has been processed, ${customerName}.</p>
        </div>

        <!-- Order Details -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin-bottom: 30px;">
          <p style="margin: 0 0 5px; color: #666; font-size: 14px;">Order Number</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">${orderNumber}</p>
        </div>

        ${refundAmount ? `
        <!-- Refund Amount -->
        <div style="background-color: #dcfce7; border: 1px solid #22c55e; padding: 20px; margin-bottom: 30px; border-radius: 8px; text-align: center;">
          <p style="margin: 0 0 5px; color: #166534; font-size: 14px;">Refund Amount</p>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #15803d;">${formatPrice(refundAmount)}</p>
          <p style="margin: 10px 0 0; color: #166534; font-size: 12px;">
            Refund will be credited within 5-7 business days
          </p>
        </div>
        ` : ""}

        <!-- Information -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 16px; margin-bottom: 15px;">What's Next?</h3>
          <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
            <li>Refund will reflect in your original payment method</li>
            <li>Bank processing may take 5-7 business days</li>
            <li>For wallet payments, balance is credited instantly</li>
          </ul>
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
    await resend.emails.send({
      from: "Alaire <orders@alaire.in>",
      to: customerEmail,
      subject: `Refund Processed for Order ${orderNumber}`,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send refund email:", error)
    return false
  }
}
