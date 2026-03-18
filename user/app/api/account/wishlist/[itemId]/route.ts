import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { ObjectId } from "mongodb"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const { itemId } = await params
    if (!itemId || !ObjectId.isValid(itemId)) {
      return NextResponse.json(
        { message: "Invalid item ID" },
        { status: 400 }
      )
    }

    const db = await getDb()

    const searchIds = [userId]

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
