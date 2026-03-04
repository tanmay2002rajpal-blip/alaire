import { NextResponse } from "next/server"
import { getDb } from "@/lib/db/client"
import { Resend } from "resend"

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

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const db = await getDb()

    // Save/Update OTP in database
    await db.collection("otps").updateOne(
      { email },
      {
        $set: {
          email,
          otp,
          expires_at: expiresAt,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    )

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "Alaire <noreply@omrajpal.tech>", 
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
    } else {
      console.log("No RESEND_API_KEY. OTP is:", otp)
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
