"use server"

import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SubscribeResult {
  success: boolean
  error?: string
}

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email address" }
  }

  const supabase = await createClient()

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, is_active")
    .eq("email", email.toLowerCase())
    .single()

  if (existing?.is_active) {
    return { success: false, error: "Email already subscribed" }
  }

  // Insert or reactivate subscription
  const { error: dbError } = await supabase
    .from("newsletter_subscribers")
    .upsert({
      email: email.toLowerCase(),
      is_active: true,
      subscribed_at: new Date().toISOString(),
      unsubscribed_at: null,
    }, { onConflict: "email" })

  if (dbError) {
    console.error("Newsletter subscription error:", dbError)
    return { success: false, error: "Failed to subscribe. Please try again." }
  }

  // Send welcome email (don't fail subscription if email fails)
  try {
    await resend.emails.send({
      from: "Alaire <noreply@alaire.com>",
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
    // Don't return error - subscription succeeded
  }

  return { success: true }
}
