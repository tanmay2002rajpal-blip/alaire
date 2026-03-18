import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { serializeDocs } from "@/lib/db/helpers"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const db = await getDb()

    const searchIds = [userId]

    // Use aggregation pipeline to avoid N+1 queries
    const wishlistItems = await db
      .collection("wishlists")
      .aggregate([
        { $match: { user_id: { $in: searchIds } } },
        { $sort: { created_at: -1 as const } },
        // Convert product_id string to ObjectId for lookup
        {
          $addFields: {
            product_oid: {
              $cond: {
                if: { $and: [{ $ne: ["$product_id", null] }, { $ne: ["$product_id", ""] }] },
                then: { $toObjectId: "$product_id" },
                else: null,
              },
            },
          },
        },
        // Lookup products
        {
          $lookup: {
            from: "products",
            localField: "product_oid",
            foreignField: "_id",
            as: "product_docs",
          },
        },
        // Lookup variants using string product_id
        {
          $lookup: {
            from: "product_variants",
            localField: "product_id",
            foreignField: "product_id",
            pipeline: [
              { $project: { price: 1, compare_at_price: 1 } },
              { $limit: 1 },
            ],
            as: "variant_docs",
          },
        },
        // Shape the output
        {
          $addFields: {
            product: {
              $cond: {
                if: { $gt: [{ $size: "$product_docs" }, 0] },
                then: {
                  $mergeObjects: [
                    { $arrayElemAt: ["$product_docs", 0] },
                    { variants: "$variant_docs" },
                  ],
                },
                else: null,
              },
            },
          },
        },
        // Remove temporary fields
        {
          $project: {
            product_oid: 0,
            product_docs: 0,
            variant_docs: 0,
          },
        },
      ])
      .toArray()

    // Serialize ObjectId and Date fields for the client
    const serialized = serializeDocs(wishlistItems).map((item: Record<string, unknown>) => {
      if (item.product && typeof item.product === "object") {
        const product = item.product as Record<string, unknown>
        // Serialize nested product and its variants
        const id = product._id?.toString?.() ?? product.id
        const variants = Array.isArray(product.variants)
          ? product.variants.map((v: Record<string, unknown>) => ({
              ...v,
              id: v._id?.toString?.() ?? v.id,
              _id: undefined,
            }))
          : []
        return {
          ...item,
          product: { ...product, id, _id: undefined, variants },
        }
      }
      return item
    })

    return NextResponse.json({ items: serialized })
  } catch (error) {
    console.error("Wishlist fetch error:", error)
    return NextResponse.json({ items: [] })
  }
}
