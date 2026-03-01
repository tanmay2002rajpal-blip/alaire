import { getDb } from "../client"
import { serializeDoc, serializeDocs } from "../helpers"
import type { Product, Category, ProductVariant } from "@/types"

// ============================================================================
// Types
// ============================================================================

export type ProductWithRelations = Product & {
  variants: ProductVariant[]
  category: Category | null
}

export type ProductSortOption = "newest" | "price_asc" | "price_desc" | "name_asc"

export interface GetProductsOptions {
  category?: string
  priceMin?: number
  priceMax?: number
  sort?: ProductSortOption
  limit?: number
  offset?: number
}

// ============================================================================
// Queries
// ============================================================================

export async function getProducts(
  options: GetProductsOptions = {}
): Promise<ProductWithRelations[]> {
  const db = await getDb()
  const {
    category,
    priceMin,
    priceMax,
    sort = "newest",
    limit = 24,
    offset = 0,
  } = options

  // Build match filter
  const match: Record<string, unknown> = { is_active: true }

  if (category) {
    const cat = await db.collection("categories").findOne({ slug: category })
    if (cat) {
      match.category_id = cat._id.toString()
    }
  }

  // Build sort
  let sortObj: Record<string, 1 | -1> = {}
  switch (sort) {
    case "price_asc":
      sortObj = { base_price: 1 }
      break
    case "price_desc":
      sortObj = { base_price: -1 }
      break
    case "name_asc":
      sortObj = { name: 1 }
      break
    case "newest":
    default:
      sortObj = { created_at: -1 }
  }

  const pipeline = [
    { $match: match },
    { $sort: sortObj },
    { $skip: offset },
    { $limit: limit },
    {
      $lookup: {
        from: "product_variants",
        let: { pid: { $toString: "$_id" } },
        pipeline: [{ $match: { $expr: { $eq: ["$product_id", "$$pid"] } } }],
        as: "variants",
      },
    },
    {
      $lookup: {
        from: "categories",
        let: { catId: "$category_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: [{ $toString: "$_id" }, "$$catId"] },
            },
          },
        ],
        as: "categoryArr",
      },
    },
    {
      $addFields: {
        category: { $arrayElemAt: ["$categoryArr", 0] },
      },
    },
    { $project: { categoryArr: 0 } },
  ]

  const docs = await db.collection("products").aggregate(pipeline).toArray()

  let products = docs.map((doc) => {
    const s = serializeDoc(doc)
    return {
      ...s,
      variants: serializeDocs(s.variants || []),
      category: s.category ? serializeDoc(s.category) : null,
    } as unknown as ProductWithRelations
  })

  // Client-side price filtering
  if (priceMin !== undefined || priceMax !== undefined) {
    products = products.filter((product) => {
      const price = product.variants?.[0]?.price ?? product.base_price ?? 0
      if (priceMin !== undefined && price < priceMin) return false
      if (priceMax !== undefined && price > priceMax) return false
      return true
    })
  }

  return products
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithRelations | null> {
  const db = await getDb()

  const pipeline = [
    { $match: { slug, is_active: true } },
    {
      $lookup: {
        from: "product_variants",
        let: { pid: { $toString: "$_id" } },
        pipeline: [{ $match: { $expr: { $eq: ["$product_id", "$$pid"] } } }],
        as: "variants",
      },
    },
    {
      $lookup: {
        from: "product_options",
        let: { pid: { $toString: "$_id" } },
        pipeline: [{ $match: { $expr: { $eq: ["$product_id", "$$pid"] } } }],
        as: "options",
      },
    },
    {
      $lookup: {
        from: "product_details",
        let: { pid: { $toString: "$_id" } },
        pipeline: [{ $match: { $expr: { $eq: ["$product_id", "$$pid"] } } }],
        as: "details",
      },
    },
    {
      $lookup: {
        from: "categories",
        let: { catId: "$category_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: [{ $toString: "$_id" }, "$$catId"] },
            },
          },
        ],
        as: "categoryArr",
      },
    },
    {
      $addFields: {
        category: { $arrayElemAt: ["$categoryArr", 0] },
      },
    },
    { $project: { categoryArr: 0 } },
  ]

  const docs = await db.collection("products").aggregate(pipeline).toArray()

  if (docs.length === 0) return null

  const doc = docs[0]
  const s = serializeDoc(doc)
  return {
    ...s,
    variants: serializeDocs(s.variants || []),
    options: serializeDocs(s.options || []),
    details: serializeDocs(s.details || []),
    category: s.category ? serializeDoc(s.category) : null,
  } as unknown as ProductWithRelations
}

export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithRelations[]> {
  return getProducts({ sort: "newest", limit })
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<ProductWithRelations[]> {
  const db = await getDb()

  // Try manually configured related products
  const relatedDocs = await db
    .collection("related_products")
    .find({ product_id: productId })
    .limit(limit)
    .toArray()

  if (relatedDocs.length > 0) {
    const ids = relatedDocs.map((r) => r.related_product_id)

    const pipeline = [
      {
        $match: {
          is_active: true,
          $expr: { $in: [{ $toString: "$_id" }, ids] },
        },
      },
      {
        $lookup: {
          from: "product_variants",
          let: { pid: { $toString: "$_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$product_id", "$$pid"] } } }],
          as: "variants",
        },
      },
      {
        $lookup: {
          from: "categories",
          let: { catId: "$category_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: "$_id" }, "$$catId"] },
              },
            },
          ],
          as: "categoryArr",
        },
      },
      {
        $addFields: {
          category: { $arrayElemAt: ["$categoryArr", 0] },
        },
      },
      { $project: { categoryArr: 0 } },
    ]

    const docs = await db.collection("products").aggregate(pipeline).toArray()
    if (docs.length > 0) {
      return docs.map((doc) => {
        const s = serializeDoc(doc)
        return {
          ...s,
          variants: serializeDocs(s.variants || []),
          category: s.category ? serializeDoc(s.category) : null,
        } as unknown as ProductWithRelations
      })
    }
  }

  // Fallback: same category
  if (categoryId) {
    const pipeline = [
      {
        $match: {
          category_id: categoryId,
          is_active: true,
          $expr: { $ne: [{ $toString: "$_id" }, productId] },
        },
      },
      { $limit: limit },
      {
        $lookup: {
          from: "product_variants",
          let: { pid: { $toString: "$_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$product_id", "$$pid"] } } }],
          as: "variants",
        },
      },
      {
        $lookup: {
          from: "categories",
          let: { catId: "$category_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: "$_id" }, "$$catId"] },
              },
            },
          ],
          as: "categoryArr",
        },
      },
      {
        $addFields: {
          category: { $arrayElemAt: ["$categoryArr", 0] },
        },
      },
      { $project: { categoryArr: 0 } },
    ]

    const docs = await db.collection("products").aggregate(pipeline).toArray()
    return docs.map((doc) => {
      const s = serializeDoc(doc)
      return {
        ...s,
        variants: serializeDocs(s.variants || []),
        category: s.category ? serializeDoc(s.category) : null,
      } as unknown as ProductWithRelations
    })
  }

  return []
}

export async function getRecentlyViewed(
  userId: string,
  excludeProductId?: string,
  limit = 4
): Promise<Product[]> {
  const db = await getDb()

  const docs = await db
    .collection("recently_viewed")
    .find({ user_id: userId })
    .sort({ viewed_at: -1 })
    .limit(limit + 1)
    .toArray()

  if (docs.length === 0) return []

  const productIds = docs.map((d) => d.product_id)

  const products = await db
    .collection("products")
    .find({
      $expr: { $in: [{ $toString: "$_id" }, productIds] },
      is_active: true,
    })
    .toArray()

  return serializeDocs(products)
    .filter((p) => p.id !== excludeProductId)
    .slice(0, limit) as unknown as Product[]
}
