"use server"

import { createClient } from "@/lib/supabase/server"

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

/**
 * Sanitizes user input to prevent XSS and SQL wildcard injection.
 * Removes potentially dangerous characters while preserving valid search terms.
 */
function sanitizeSearchQuery(query: string): string {
  return query
    // Remove HTML/script tags
    .replace(/<[^>]*>/g, "")
    // Remove dangerous characters that could be used for XSS
    .replace(/[<>"'`\\]/g, "")
    // Escape SQL LIKE wildcards to prevent pattern injection
    .replace(/[%_]/g, "\\$&")
    // Trim and limit length to prevent abuse
    .trim()
    .slice(0, 100)
}

export async function searchProducts(query: string): Promise<SearchResult> {
  if (!query || query.length < 2) {
    return { products: [], categories: [] }
  }

  // Sanitize the input query
  const sanitizedQuery = sanitizeSearchQuery(query)
  
  // If sanitization removed everything meaningful, return empty
  if (sanitizedQuery.length < 2) {
    return { products: [], categories: [] }
  }

  const supabase = await createClient()
  const searchTerm = `%${sanitizedQuery}%`

  // Search products
  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      base_price,
      images,
      variants:product_variants(price)
    `)
    .eq("is_active", true)
    .ilike("name", searchTerm)
    .limit(5)

  // Search categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .ilike("name", searchTerm)
    .limit(3)

  return {
    products: (products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.variants?.[0]?.price ?? p.base_price,
      image: p.images?.[0] ?? null,
    })),
    categories: categories ?? [],
  }
}
