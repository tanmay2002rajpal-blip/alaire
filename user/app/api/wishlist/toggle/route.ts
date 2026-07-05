import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function POST(request: Request) {
  try {
    const session = await auth()

    const { productId } = await request.json()
    const userId = session?.user?.id

    if (!productId || typeof productId !== "string" || !ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      )
    }

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

    // Match both string and ObjectId forms of user_id so we find entries
    // regardless of how they were stored (mirrors the account wishlist read).
    const userIdVariants: (string | ObjectId)[] = [targetUserId]
    if (userId !== targetUserId) userIdVariants.push(userId)
    if (ObjectId.isValid(targetUserId)) userIdVariants.push(new ObjectId(targetUserId))

    const existing = await db.collection("wishlists").findOne({
      user_id: { $in: userIdVariants },
      product_id: productId,
    })

    if (existing) {
      await db.collection("wishlists").deleteOne({ _id: existing._id })
      return NextResponse.json({ added: false })
    } else {
      await db.collection("wishlists").insertOne({
        user_id: targetUserId,
        product_id: productId,
        created_at: new Date(),
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
