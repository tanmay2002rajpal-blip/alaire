"use server"

import { getDb } from "@/lib/db/client"
import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export interface SubscribeResult {
  success: boolean
  error?: string
}

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email address" }
  }

  const db = await getDb()
  const col = db.collection("newsletter_subscribers")

  const existing = await col.findOne({ email: email.toLowerCase() })

  if (existing?.is_active) {
    return { success: false, error: "Email already subscribed" }
  }

  await col.updateOne(
    { email: email.toLowerCase() },
    {
      $set: {
        email: email.toLowerCase(),
        is_active: true,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      },
    },
    { upsert: true }
  )

  // Send welcome email (don't fail subscription if email fails)
  try {
    await getResend().emails.send({
      from: "Alaire <noreply@omrajpal.tech>",
      to: email.toLowerCase(),
      subject: "Welcome to Alaire",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 28px; margin-bottom: 20px;">Welcome to Alaire</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Thank you for subscribing to our newsletter. You'll be the first to know about:
          </p>
          <ul style="font-size: 16px; line-height: 1.8; color: #333;">
            <li>New arrivals and collections</li>
            <li>Exclusive offers and promotions</li>
            <li>Curated style guides</li>
          </ul>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If you didn't subscribe, you can safely ignore this email.
          </p>
        </div>
      `,
    })
  } catch (emailError) {
    console.error("Welcome email failed:", emailError)
  }

  return { success: true }
}
