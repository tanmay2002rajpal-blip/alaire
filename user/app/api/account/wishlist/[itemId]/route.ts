import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { ObjectId } from "mongodb"

export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const userId = session?.user?.id || searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { itemId } = params
    if (!itemId || !ObjectId.isValid(itemId)) {
      return NextResponse.json(
        { message: "Invalid item ID" },
        { status: 400 }
      )
    }

    const db = await getDb()

    let searchIds = [userId]
    if (userId.includes("@")) {
      const userDoc = await db.collection("users").findOne({ email: userId })
      if (userDoc) searchIds.push(userDoc._id.toString())
    }

    const result = await db.collection("wishlists").deleteOne({
      _id: new ObjectId(itemId),
      user_id: { $in: searchIds },
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Item not found or unauthorized" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Wishlist item delete error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
