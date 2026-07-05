import { NextResponse } from "next/server"
import crypto from "crypto"
import { fulfillPaidOrder } from "@/lib/checkout/fulfill-order"

/**
 * Razorpay webhook (server-to-server safety net).
 *
 * The order is normally created when the browser calls /api/checkout/verify-payment
 * after Razorpay captures the payment. If the customer closes the tab between capture
 * and that call, money is taken but no order exists. This webhook fixes that: Razorpay
 * fires payment.captured/order.paid independently of the browser, and we fulfil the
 * order here. fulfillPaidOrder is idempotent, so a webhook + verify-payment race can
 * never double-create an order.
 *
 * This is NOT gated by NextAuth (webhooks carry no user session) — it is authenticated
 * by the HMAC signature on the raw body. It is also outside the middleware matcher
 * (which only covers /account and /checkout).
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("Razorpay webhook rejected: RAZORPAY_WEBHOOK_SECRET is not set")
    return NextResponse.json(
      { message: "Webhook not configured" },
      { status: 500 }
    )
  }

  // Raw body is required for signature verification — do NOT parse before verifying.
  const rawBody = await request.text()
  const signature = request.headers.get("x-razorpay-signature") || ""

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex")

  const signatureValid =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    )

  if (!signatureValid) {
    return NextResponse.json(
      { message: "Invalid webhook signature" },
      { status: 400 }
    )
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
  }

  try {
    if (event?.event === "payment.captured" || event?.event === "order.paid") {
      const paymentEntity = event?.payload?.payment?.entity
      const razorpayOrderId = paymentEntity?.order_id
      const razorpayPaymentId = paymentEntity?.id

      if (razorpayOrderId && razorpayPaymentId) {
        const result = await fulfillPaidOrder({ razorpayOrderId, razorpayPaymentId })
        if (result.created) {
          console.log(
            `Razorpay webhook (${event.event}) created order ${result.orderId} for ${razorpayOrderId}`
          )
        }
      } else {
        console.error(
          `Razorpay webhook (${event.event}) missing order_id/payment id in payload`
        )
      }
    }
  } catch (error) {
    // A THROW here means the critical section failed and fulfillPaidOrder already
    // re-inserted the claimed checkout_session for recovery. Return 500 so Razorpay
    // RETRIES (it retries failed webhooks for ~24h) — the retry re-claims the restored
    // session and fulfils the order. This is what closes the charged-but-no-order gap
    // when the browser also never returns. (FShip/email failures are non-fatal inside
    // fulfillPaidOrder and never reach here.)
    console.error("Razorpay webhook processing error — returning 500 for retry:", error)
    return NextResponse.json({ message: "Processing failed, retry" }, { status: 500 })
  }

  // 200 on a valid signature for success, idempotent duplicate, or a no-session/no-order
  // event that a retry cannot help — so Razorpay stops retrying those.
  return NextResponse.json({ received: true })
}
