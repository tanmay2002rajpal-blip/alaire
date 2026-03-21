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
        subject: `${otp} — Your Alaire verification code`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f7f4ef; -webkit-font-smoothing: antialiased;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f4ef;">
              <tr>
                <td align="center" style="padding: 48px 16px;">
                  <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">
                    <!-- Logo -->
                    <tr>
                      <td align="center" style="padding-bottom: 32px;">
                        <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: normal; letter-spacing: 6px; color: #1a1a1a;">ALAIRE</h1>
                      </td>
                    </tr>
                    <!-- Card -->
                    <tr>
                      <td style="background-color: #ffffff; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                        <div style="height: 3px; background: linear-gradient(90deg, #c4a265, #dfc08a, #c4a265);"></div>
                        <div style="padding: 48px 40px; text-align: center;">
                          <h2 style="margin: 0 0 12px; font-family: Georgia, serif; font-size: 22px; font-weight: normal; color: #1a1a1a; letter-spacing: 1px;">Your Verification Code</h2>
                          <p style="margin: 0 0 32px; font-family: -apple-system, sans-serif; font-size: 15px; color: #8a7e6b; line-height: 1.5;">
                            Enter this code to sign in to your Alaire account.
                          </p>
                          <div style="background-color: #faf8f4; border: 1px solid #f0ece4; padding: 24px; margin: 0 auto; display: inline-block;">
                            <span style="font-family: 'SF Mono', 'Fira Code', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #1a1a1a;">${otp}</span>
                          </div>
                          <p style="margin: 24px 0 0; font-family: -apple-system, sans-serif; font-size: 13px; color: #b8ad9e;">
                            This code expires in 10 minutes.
                          </p>
                        </div>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 28px 20px; text-align: center;">
                        <p style="margin: 0 0 4px; font-family: -apple-system, sans-serif; font-size: 12px; color: #b8ad9e;">
                          If you didn't request this code, you can safely ignore this email.
                        </p>
                        <p style="margin: 0; font-family: -apple-system, sans-serif; font-size: 12px; color: #b8ad9e;">
                          &copy; ${new Date().getFullYear()} Alaire
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
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
