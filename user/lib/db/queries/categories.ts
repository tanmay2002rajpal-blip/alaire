import { getDb } from "../client"
import { serializeDoc, serializeDocs } from "../helpers"
import type { Category } from "@/types"

// ============================================================================
// Types
// ============================================================================

export type CategoryWithCount = Category & {
  product_count: number
}

// ============================================================================
// Queries
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  const db = await getDb()

  const docs = await db
    .collection("categories")
    .find({ is_active: true })
    .sort({ position: 1 })
    .toArray()

  return serializeDocs(docs) as unknown as Category[]
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const db = await getDb()

  const pipeline = [
    { $match: { is_active: true } },
    { $sort: { position: 1 } },
    {
      $lookup: {
        from: "products",
        let: { catId: { $toString: "$_id" } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: [{ $toString: "$category_id" }, "$$catId"] },
              is_active: true,
            },
          },
          { $count: "count" },
        ],
        as: "product_counts",
      },
    },
    {
      $addFields: {
        product_count: {
          $ifNull: [{ $arrayElemAt: ["$product_counts.count", 0] }, 0],
        },
      },
    },
    { $project: { product_counts: 0 } },
  ]

  const docs = await db.collection("categories").aggregate(pipeline).toArray()

  return docs.map((doc) => serializeDoc(doc)) as unknown as CategoryWithCount[]
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const db = await getDb()

  const doc = await db
    .collection("categories")
    .findOne({ slug, is_active: true })

  if (!doc) return null

  return serializeDoc(doc) as unknown as Category
}
