import { NextResponse } from "next/server"
import { randomInt, createHash } from "crypto"
import { getDb } from "@/lib/db/client"
import { Resend } from "resend"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Rate limiting
    const clientIp = getClientIp(req)
    const emailLimit = checkRateLimit(`otp-email:${email}`, { maxRequests: 3, windowMs: 600000 })
    const ipLimit = checkRateLimit(`otp-ip:${clientIp}`, { maxRequests: 10, windowMs: 3600000 })
    if (!emailLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      )
    }

    // Generate 6 digit OTP using crypto
    const otp = randomInt(100000, 999999).toString()
    const hashedOtp = createHash("sha256").update(otp).digest("hex")
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const db = await getDb()

    // Save/Update hashed OTP in database
    await db.collection("otps").updateOne(
      { email },
      {
        $set: {
          email,
          otp: hashedOtp,
          expires_at: expiresAt,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    )

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "Alaire <noreply@alaire.in>",
        to: email,
        subject: "Your login code for Alaire",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 24px; letter-spacing: 2px;">ALAIRE</h1>
            <p>Your one-time password to sign in to Alaire is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 12px 0; color: #000;">${otp}</div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px; margin-top: 32px;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("OTP generation error:", error)
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    )
  }
}
