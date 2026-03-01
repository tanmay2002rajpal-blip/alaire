import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { notificationId } = await request.json()
    const db = await getDb()

    await db.collection("notifications").updateOne(
      {
        _id: new ObjectId(notificationId),
        user_id: session.user.id,
      },
      { $set: { read: true } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark read error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
