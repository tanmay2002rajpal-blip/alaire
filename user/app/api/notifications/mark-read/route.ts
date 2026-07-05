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

    if (!notificationId || !ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { message: "Invalid notification ID" },
        { status: 400 }
      )
    }

    const db = await getDb()

    // user_id may be stored as a string or an ObjectId (return-request writes an
    // ObjectId). Match both forms so mark-read works regardless of how it was set.
    const userId = session.user.id
    const userIdForms: (string | ObjectId)[] = [userId]
    if (ObjectId.isValid(userId)) {
      userIdForms.push(new ObjectId(userId))
    }

    await db.collection("notifications").updateOne(
      {
        _id: new ObjectId(notificationId),
        user_id: { $in: userIdForms },
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
