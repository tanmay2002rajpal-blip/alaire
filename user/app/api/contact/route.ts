import { NextResponse } from "next/server"
import { z } from "zod"
import { getDb } from "@/lib/db/client"

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long").trim(),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long").trim(),
  email: z.string().email("Please provide a valid email address").max(254, "Email is too long"),
  phone: z.string().max(20, "Phone number is too long").trim().optional().default(""),
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long").trim(),
  message: z.string().min(1, "Message is required").max(5000, "Message is too long (max 5000 characters)").trim(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input"
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, phone, subject, message } = parsed.data

    const db = await getDb()

    await db.collection("contact_messages").insertOne({
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      phone: phone || null,
      subject,
      message,
      status: "unread",
      created_at: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
