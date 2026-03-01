"use server"

import { getDb } from "@/lib/db/client"
import { serializeDocs } from "@/lib/db/helpers"

export interface SearchResult {
  products: Array<{
    id: string
    name: string
    slug: string
    price: number
    image: string | null
  }>
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
}

function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'`\\]/g, "")
    .replace(/[%_]/g, "\\$&")
    .trim()
    .slice(0, 100)
}

export async function searchProducts(query: string): Promise<SearchResult> {
  if (!query || query.length < 2) {
    return { products: [], categories: [] }
  }

  const sanitizedQuery = sanitizeSearchQuery(query)

  if (sanitizedQuery.length < 2) {
    return { products: [], categories: [] }
  }

  const db = await getDb()
  // Escape regex special characters for safe $regex usage
  const escapedQuery = sanitizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  const [productDocs, categoryDocs] = await Promise.all([
    db
      .collection("products")
      .aggregate([
        {
          $match: {
            is_active: true,
            name: { $regex: escapedQuery, $options: "i" },
          },
        },
        { $limit: 5 },
        {
          $lookup: {
            from: "product_variants",
            let: { pid: { $toString: "$_id" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$product_id", "$$pid"] } } },
              { $limit: 1 },
              { $project: { price: 1 } },
            ],
            as: "variants",
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            base_price: 1,
            images: 1,
            variants: 1,
          },
        },
      ])
      .toArray(),
    db
      .collection("categories")
      .find({
        is_active: true,
        name: { $regex: escapedQuery, $options: "i" },
      })
      .project({ name: 1, slug: 1 })
      .limit(3)
      .toArray(),
  ])

  return {
    products: serializeDocs(productDocs).map((p) => ({
      id: p.id,
      name: (p as Record<string, unknown>).name as string,
      slug: (p as Record<string, unknown>).slug as string,
      price:
        ((p as Record<string, unknown>).variants as Array<{ price: number }>)?.[0]?.price ??
        ((p as Record<string, unknown>).base_price as number),
      image: ((p as Record<string, unknown>).images as string[])?.[0] ?? null,
    })),
    categories: serializeDocs(categoryDocs).map((c) => ({
      id: c.id,
      name: (c as Record<string, unknown>).name as string,
      slug: (c as Record<string, unknown>).slug as string,
    })),
  }
}
