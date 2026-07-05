import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { fulfillPaidOrder } from "@/lib/checkout/fulfill-order"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { verifyPaymentSchema, validateRequest, type VerifyPaymentInput } from "@/lib/validations/api"

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimitResult = await checkRateLimit(`verify-payment:${clientIp}`, { maxRequests: 10, windowMs: 60000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

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

    const isValid = generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature, "hex"),
        Buffer.from(razorpay_signature, "hex")
      )

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid payment signature" },
        { status: 400 }
      )
    }

    // ========================================================================
    // Fulfil the paid order. Idempotent: whoever claims the checkout session
    // first runs the full fulfillment; a replay/double-submit returns the
    // already-created order.
    // ========================================================================

    const result = await fulfillPaidOrder({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    })

    if (result.orderId) {
      return NextResponse.json({ success: true, orderId: result.orderId })
    }

    return NextResponse.json(
      { message: result.error || "Checkout session not found or expired" },
      { status: 404 }
    )
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
