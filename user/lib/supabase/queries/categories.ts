/**
 * @fileoverview Category-related database queries.
 * Handles fetching product categories for navigation and filtering.
 *
 * @module lib/supabase/queries/categories
 */

import { createClient } from "../server"
import type { Category } from "@/types"

// ============================================================================
// Types
// ============================================================================

/**
 * Category with product count for displaying in UI.
 */
export type CategoryWithCount = Category & {
  /** Number of active products in this category */
  product_count: number
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetches all active categories ordered by position.
 * Used for navigation menus and category listings.
 *
 * @returns Array of active categories
 *
 * @example
 * ```ts
 * const categories = await getCategories()
 * // Render navigation menu
 * categories.map(cat => <NavLink href={`/categories/${cat.slug}`}>{cat.name}</NavLink>)
 * ```
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true })

  if (error) {
    console.error("[getCategories] Error fetching categories:", error)
    return []
  }

  return data ?? []
}

/**
 * Fetches all active categories with their product counts.
 * Used for category pages and sidebars showing available products.
 *
 * @returns Array of categories with product counts
 *
 * @example
 * ```ts
 * const categories = await getCategoriesWithCounts()
 * // Display: "Dresses (24)"
 * categories.map(cat => `${cat.name} (${cat.product_count})`)
 * ```
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select(`
      *,
      products:products(count)
    `)
    .eq("is_active", true)
    .eq("products.is_active", true)
    .order("position", { ascending: true })

  if (error) {
    console.error("[getCategoriesWithCounts] Error fetching categories:", error)
    return []
  }

  // Transform the count from array format to number
  return (data ?? []).map((category) => ({
    ...category,
    product_count: (category.products as { count: number }[])?.[0]?.count ?? 0,
  }))
}

/**
 * Fetches a single category by its URL slug.
 * Used for category detail pages and breadcrumbs.
 *
 * @param slug - Category URL slug
 * @returns Category data or null if not found
 *
 * @example
 * ```ts
 * const category = await getCategoryBySlug('evening-wear')
 * if (category) {
 *   // Render category page with category.name, category.description
 * }
 * ```
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("[getCategoryBySlug] Error fetching category:", error)
    return null
  }

  return data
}
