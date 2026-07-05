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

    const { itemId } = await request.json()

    if (!itemId || !ObjectId.isValid(itemId)) {
      return NextResponse.json(
        { message: "Invalid item ID" },
        { status: 400 }
      )
    }

    const db = await getDb()

    const userId = session.user.id
    let targetUserId = userId
    if (userId.includes("@")) {
      const userDoc = await db.collection("users").findOne({ email: userId })
      if (userDoc) targetUserId = userDoc._id.toString()
    }

    // Match both string and ObjectId forms of user_id.
    const userIdVariants: (string | ObjectId)[] = [targetUserId]
    if (userId !== targetUserId) userIdVariants.push(userId)
    if (ObjectId.isValid(targetUserId)) userIdVariants.push(new ObjectId(targetUserId))

    await db.collection("wishlists").deleteOne({
      _id: new ObjectId(itemId),
      user_id: { $in: userIdVariants },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Wishlist remove error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
