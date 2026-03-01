import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please login to add items to wishlist", requireAuth: true },
        { status: 401 }
      )
    }

    const { productId } = await request.json()
    const db = await getDb()

    const existing = await db.collection("wishlists").findOne({
      user_id: session.user.id,
      product_id: productId,
    })

    if (existing) {
      await db.collection("wishlists").deleteOne({ _id: existing._id })
      return NextResponse.json({ added: false })
    } else {
      await db.collection("wishlists").insertOne({
        user_id: session.user.id,
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
