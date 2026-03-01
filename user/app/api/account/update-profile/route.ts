import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

interface UpdateProfileRequest {
  fullName: string
  phone: string
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

    const body: UpdateProfileRequest = await request.json()
    const { fullName, phone } = body
    const db = await getDb()

    await db.collection("users").updateOne(
      { $expr: { $eq: [{ $toString: "$_id" }, session.user.id] } },
      {
        $set: {
          full_name: fullName,
          name: fullName,
          phone,
          updated_at: new Date().toISOString(),
        },
      },
      { upsert: true }
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
