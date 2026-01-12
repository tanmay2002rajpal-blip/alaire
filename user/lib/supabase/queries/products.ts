/**
 * @fileoverview Product-related database queries.
 * Handles fetching products with filtering, sorting, and pagination.
 *
 * @module lib/supabase/queries/products
 */

import { createClient } from "../server"
import type { Product, Category, ProductVariant } from "@/types"

// ============================================================================
// Types
// ============================================================================

/**
 * Product with all related data (variants, category).
 * Used for product listings and detail pages.
 */
export type ProductWithRelations = Product & {
  variants: ProductVariant[]
  category: Category | null
}

/**
 * Sort options for product listings.
 */
export type ProductSortOption = "newest" | "price_asc" | "price_desc" | "name_asc"

/**
 * Options for filtering and paginating products.
 */
export interface GetProductsOptions {
  /** Filter by category slug */
  category?: string
  /** Minimum price filter */
  priceMin?: number
  /** Maximum price filter */
  priceMax?: number
  /** Sort order (default: newest) */
  sort?: ProductSortOption
  /** Number of products to fetch (default: 24) */
  limit?: number
  /** Offset for pagination (default: 0) */
  offset?: number
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetches products with optional filtering, sorting, and pagination.
 *
 * Features:
 * - Category filtering by slug
 * - Price range filtering (client-side due to variant prices)
 * - Multiple sort options
 * - Pagination support
 *
 * @param options - Query options for filtering and sorting
 * @returns Array of products with their variants and category
 *
 * @example
 * ```ts
 * // Get newest products
 * const products = await getProducts({ sort: 'newest', limit: 12 })
 *
 * // Get products in a category with price filter
 * const filtered = await getProducts({
 *   category: 'dresses',
 *   priceMin: 1000,
 *   priceMax: 5000,
 *   sort: 'price_asc'
 * })
 * ```
 */
export async function getProducts(
  options: GetProductsOptions = {}
): Promise<ProductWithRelations[]> {
  const supabase = await createClient()
  const {
    category,
    priceMin,
    priceMax,
    sort = "newest",
    limit = 24,
    offset = 0,
  } = options

  // Build base query with relations
  let query = supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .eq("is_active", true)

  // Filter by category if provided
  if (category) {
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single()

    if (categoryData) {
      query = query.eq("category_id", categoryData.id)
    }
  }

  // Apply sorting based on option
  switch (sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true })
      break
    case "price_desc":
      query = query.order("base_price", { ascending: false })
      break
    case "name_asc":
      query = query.order("name", { ascending: true })
      break
    case "newest":
    default:
      query = query.order("created_at", { ascending: false })
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    console.error("[getProducts] Error fetching products:", error)
    return []
  }

  let products = (data as ProductWithRelations[]) ?? []

  // Client-side price filtering (needed because price depends on variants)
  // TODO: Consider moving this to a database function for better performance
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

/**
 * Fetches a single product by its URL slug.
 * Includes all related data: variants, options, details, and category.
 *
 * @param slug - Product URL slug
 * @returns Product with all relations, or null if not found
 *
 * @example
 * ```ts
 * const product = await getProductBySlug('silk-evening-gown')
 * if (product) {
 *   console.log(product.name, product.variants.length)
 * }
 * ```
 */
export async function getProductBySlug(
  slug: string
): Promise<ProductWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*),
      options:product_options(*),
      details:product_details(*)
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("[getProductBySlug] Error fetching product:", error)
    return null
  }

  return data as ProductWithRelations
}

/**
 * Fetches featured/newest products for homepage display.
 *
 * @param limit - Maximum number of products to return (default: 8)
 * @returns Array of featured products
 *
 * @example
 * ```ts
 * const featured = await getFeaturedProducts(4)
 * ```
 */
export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithRelations[]> {
  return getProducts({ sort: "newest", limit })
}

/**
 * Fetches related products for a product detail page.
 * First tries manually configured related products, then falls back to
 * products in the same category.
 *
 * @param productId - Current product ID (to exclude from results)
 * @param categoryId - Category ID for fallback query
 * @param limit - Maximum number of related products (default: 4)
 * @returns Array of related products
 *
 * @example
 * ```ts
 * const related = await getRelatedProducts(
 *   product.id,
 *   product.category_id,
 *   4
 * )
 * ```
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<ProductWithRelations[]> {
  const supabase = await createClient()

  // First, try to get manually configured related products
  const { data: relatedIds } = await supabase
    .from("related_products")
    .select("related_product_id")
    .eq("product_id", productId)
    .limit(limit)

  if (relatedIds && relatedIds.length > 0) {
    const ids = relatedIds.map((r) => r.related_product_id)
    const { data } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*)
      `)
      .in("id", ids)
      .eq("is_active", true)

    if (data && data.length > 0) {
      return data as ProductWithRelations[]
    }
  }

  // Fallback: Get products from the same category
  if (categoryId) {
    const { data } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*)
      `)
      .eq("category_id", categoryId)
      .neq("id", productId)
      .eq("is_active", true)
      .limit(limit)

    return (data as ProductWithRelations[]) ?? []
  }

  return []
}

/**
 * Fetches recently viewed products for a user.
 * Used for personalized recommendations on product pages.
 *
 * @param userId - User ID to fetch history for
 * @param excludeProductId - Product ID to exclude (current product)
 * @param limit - Maximum number of products (default: 4)
 * @returns Array of recently viewed products
 */
export async function getRecentlyViewed(
  userId: string,
  excludeProductId?: string,
  limit = 4
): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("recently_viewed")
    .select(`
      product:products(*)
    `)
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit + 1) // Fetch extra in case we exclude current

  if (error || !data) return []

  // Extract products, filter out excluded and inactive
  // Supabase returns single relation as object, but types may show array
  const products = data
    .map((item: { product: Product | Product[] | null }) => {
      const product = Array.isArray(item.product) ? item.product[0] : item.product
      return product as Product | null
    })
    .filter((p): p is Product =>
      p !== null && p.is_active && p.id !== excludeProductId
    )
    .slice(0, limit)

  return products
}
