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

    await db.collection("wishlists").deleteOne({
      _id: new ObjectId(itemId),
      user_id: session.user.id,
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
