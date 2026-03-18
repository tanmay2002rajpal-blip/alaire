import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { ObjectId } from "mongodb"

interface UpdateProfileRequest {
  fullName: string
  phone: string
  userId?: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body: UpdateProfileRequest = await request.json()

    const { fullName, phone } = body

    // Validate inputs
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 100) {
      return NextResponse.json(
        { message: "Full name must be between 2 and 100 characters" },
        { status: 400 }
      )
    }

    if (phone && (typeof phone !== "string" || !/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, "")))) {
      return NextResponse.json(
        { message: "Please provide a valid phone number" },
        { status: 400 }
      )
    }

    const sanitizedName = fullName.trim()
    const sanitizedPhone = phone ? phone.trim() : ""

    const db = await getDb()

    const isEmail = userId.includes("@")
    let targetUserId = userId

    if (isEmail) {
      const userDoc = await db.collection("users").findOne({ email: userId })
      if (!userDoc) {
        // Only create user if they have a valid session (authenticated via OTP)
        if (!session?.user?.email) {
          return NextResponse.json(
            { message: "User not found" },
            { status: 404 }
          )
        }
        await db.collection("users").insertOne({
          email: userId,
          full_name: sanitizedName,
          name: sanitizedName,
          phone: sanitizedPhone,
          created_at: new Date(),
          updated_at: new Date(),
          role: "customer"
        })
        return NextResponse.json({ success: true })
      }
      targetUserId = userDoc._id.toString()
    }

    // Use ObjectId directly instead of $expr string comparison
    const filter = isEmail
      ? { _id: new ObjectId(targetUserId) }
      : ObjectId.isValid(targetUserId)
        ? { _id: new ObjectId(targetUserId) }
        : { email: targetUserId }

    await db.collection("users").updateOne(
      filter,
      {
        $set: {
          full_name: sanitizedName,
          name: sanitizedName,
          phone: sanitizedPhone,
          updated_at: new Date(),
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
