/**
 * @fileoverview Homepage-related database queries.
 * Handles fetching hero slides and other homepage content.
 *
 * @module lib/supabase/queries/homepage
 */

import { createClient } from "../server"

// ============================================================================
// Types
// ============================================================================

/**
 * Hero carousel slide data.
 */
export interface HeroSlide {
  id: string
  /** Main heading text */
  title: string
  /** Secondary heading text */
  subtitle: string | null
  /** Body text/description */
  description: string | null
  /** Background image URL */
  image_url: string
  /** CTA button text */
  button_text: string | null
  /** CTA button link */
  button_link: string | null
  /** Display order (lower = first) */
  position: number
  /** Whether slide is visible */
  is_active: boolean
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetches active hero slides for the homepage carousel.
 * Slides are ordered by position (ascending).
 *
 * @returns Array of active hero slides
 *
 * @example
 * ```tsx
 * const slides = await getHeroSlides()
 * <HeroCarousel slides={slides} />
 * ```
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true })

  if (error) {
    console.error("[getHeroSlides] Error fetching hero slides:", error)
    return []
  }

  return data ?? []
}

/**
 * Homepage statistics for display.
 */
export interface HomepageStats {
  /** Total count of active products */
  productCount: number
  /** Total count of active categories */
  categoryCount: number
  /** Average rating from approved reviews */
  averageRating: number
  /** Total count of delivered orders (proxy for happy customers) */
  customerCount: number
}

/**
 * Fetches statistics for the homepage hero section.
 * Includes product count, category count, and average rating.
 *
 * @returns Homepage statistics
 *
 * @example
 * ```tsx
 * const stats = await getHomepageStats()
 * <HeroSection stats={stats} />
 * ```
 */
export async function getHomepageStats(): Promise<HomepageStats> {
  const supabase = await createClient()

  // Fetch all counts in parallel
  const [productsResult, categoriesResult, reviewsResult, ordersResult] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("reviews").select("rating").eq("is_approved", true),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
  ])

  const productCount = productsResult.count ?? 0
  const categoryCount = categoriesResult.count ?? 0
  const customerCount = ordersResult.count ?? 0

  // Calculate average rating
  let averageRating = 0
  if (reviewsResult.data && reviewsResult.data.length > 0) {
    const sum = reviewsResult.data.reduce((acc, r) => acc + (r.rating || 0), 0)
    averageRating = Math.round((sum / reviewsResult.data.length) * 10) / 10
  }

  return {
    productCount,
    categoryCount,
    averageRating,
    customerCount,
  }
}
