import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function POST(request: Request) {
  try {
    const session = await auth()

    const { productId, userId: rawUserId } = await request.json()
    const userId = session?.user?.id || rawUserId

    if (!userId) {
      return NextResponse.json(
        { message: "Please login to add items to wishlist", requireAuth: true },
        { status: 401 }
      )
    }

    const db = await getDb()

    let targetUserId = userId
    if (userId.includes("@")) {
      const userDoc = await db.collection("users").findOne({ email: userId })
      if (userDoc) targetUserId = userDoc._id.toString()
    }

    const existing = await db.collection("wishlists").findOne({
      user_id: targetUserId,
      product_id: productId,
    })

    if (existing) {
      await db.collection("wishlists").deleteOne({ _id: existing._id })
      return NextResponse.json({ added: false })
    } else {
      await db.collection("wishlists").insertOne({
        user_id: targetUserId,
        product_id: productId,
        created_at: new Date().toISOString(),
      })
      return NextResponse.json({ added: true })
    }
  } catch (error) {
    console.error("Wishlist toggle error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
