import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { serializeDoc, serializeDocs } from "@/lib/db/helpers"

export async function GET(request: Request) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const userId = session?.user?.id || searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ items: [] })
    }

    const db = await getDb()

    let searchIds = [userId]
    if (userId.includes("@")) {
      const userDoc = await db.collection("users").findOne({ email: userId })
      if (userDoc) searchIds.push(userDoc._id.toString())
    }

    const wishlistDocs = await db
      .collection("wishlists")
      .find({ user_id: { $in: searchIds } })
      .sort({ created_at: -1 })
      .toArray()

    const wishlistItems = await Promise.all(
      wishlistDocs.map(async (wDoc) => {
        const item = serializeDoc(wDoc)
        const productDoc = await db
          .collection("products")
          .findOne({ $expr: { $eq: [{ $toString: "$_id" }, item.product_id] } })

        if (!productDoc) return { ...item, product: null }

        const product = serializeDoc(productDoc)
        const variantDocs = await db
          .collection("product_variants")
          .find({ product_id: product.id })
          .project({ price: 1, compare_at_price: 1 })
          .limit(1)
          .toArray()

        return {
          ...item,
          product: {
            ...product,
            variants: serializeDocs(variantDocs),
          },
        }
      })
    )

    return NextResponse.json({ items: wishlistItems })
  } catch (error) {
    console.error("Wishlist fetch error:", error)
    return NextResponse.json({ items: [] })
  }
}
