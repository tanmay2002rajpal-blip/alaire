import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

interface UpdateProfileRequest {
  fullName: string
  phone: string
  userId?: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const body: UpdateProfileRequest = await request.json()
    const userId = session?.user?.id || body.userId

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { fullName, phone } = body
    const db = await getDb()

    const isEmail = userId.includes("@")
    let targetUserId = userId

    if (isEmail) {
      const userDoc = await db.collection("users").findOne({ email: userId })
      if (!userDoc) {
        // Create the user if they don't exist yet but are authenticated via OTP fallback
        await db.collection("users").insertOne({
          email: userId,
          full_name: fullName,
          name: fullName,
          phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: "customer"
        })
        return NextResponse.json({ success: true })
      }
      targetUserId = userDoc._id.toString()
    }

    await db.collection("users").updateOne(
      { $expr: { $eq: [{ $toString: "$_id" }, targetUserId] } },
      {
        $set: {
          full_name: fullName,
          name: fullName,
          phone,
          updated_at: new Date().toISOString(),
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
