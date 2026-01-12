/**
 * @fileoverview Review-related database queries.
 * Handles fetching and checking product reviews.
 *
 * @module lib/supabase/queries/reviews
 */

import { createClient } from "../server"
import type { ReviewWithUser } from "@/types"

// ============================================================================
// Types
// ============================================================================

/**
 * Summary statistics for product reviews.
 */
export interface ReviewSummary {
  /** Average rating (1-5), rounded to 1 decimal place */
  average: number
  /** Total number of approved reviews */
  count: number
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetches all approved reviews for a product.
 * Includes user profile information (name, avatar).
 *
 * @param productId - Product UUID
 * @returns Array of reviews with user information
 *
 * @example
 * ```ts
 * const reviews = await getProductReviews(product.id)
 * reviews.map(review => (
 *   <ReviewCard
 *     key={review.id}
 *     rating={review.rating}
 *     content={review.content}
 *     author={review.user.full_name}
 *   />
 * ))
 * ```
 */
export async function getProductReviews(
  productId: string
): Promise<ReviewWithUser[]> {
  const supabase = await createClient()

  // First, get the reviews
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (reviewsError || !reviews) {
    console.error("[getProductReviews] Error fetching reviews:", reviewsError)
    return []
  }

  // Get unique user IDs from reviews
  const userIds = [...new Set(reviews.map((r) => r.user_id).filter(Boolean))]

  // Fetch profiles separately (no FK constraint)
  let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds)

    if (profiles) {
      profilesMap = profiles.reduce((acc, profile) => {
        acc[profile.id] = { full_name: profile.full_name, avatar_url: profile.avatar_url }
        return acc
      }, {} as typeof profilesMap)
    }
  }

  // Combine reviews with user data
  return reviews.map((review) => ({
    ...review,
    user: profilesMap[review.user_id] || { full_name: "Anonymous", avatar_url: null },
  })) as ReviewWithUser[]
}

/**
 * Calculates review summary statistics for a product.
 * Used for displaying star ratings and review counts.
 *
 * @param productId - Product UUID
 * @returns Average rating and total count
 *
 * @example
 * ```ts
 * const summary = await getReviewSummary(product.id)
 * // Display: "4.5 stars (24 reviews)"
 * console.log(`${summary.average} stars (${summary.count} reviews)`)
 * ```
 */
export async function getReviewSummary(
  productId: string
): Promise<ReviewSummary> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_approved", true)

  if (error || !data || data.length === 0) {
    return { average: 0, count: 0 }
  }

  // Calculate average and round to 1 decimal place
  const sum = data.reduce((acc, r) => acc + r.rating, 0)
  return {
    average: Math.round((sum / data.length) * 10) / 10,
    count: data.length,
  }
}

/**
 * Checks if a user can submit a review for a product.
 *
 * A user can review a product if:
 * 1. They haven't already reviewed this product
 * 2. They have purchased this product (verified purchase)
 *
 * @param userId - User UUID
 * @param productId - Product UUID
 * @returns True if user can submit a review
 *
 * @example
 * ```ts
 * const canReview = await canUserReview(user.id, product.id)
 * if (canReview) {
 *   showReviewForm()
 * }
 * ```
 */
export async function canUserReview(
  userId: string,
  productId: string
): Promise<boolean> {
  const supabase = await createClient()

  // Check if user has already reviewed this product
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single()

  if (existingReview) {
    return false // Already reviewed
  }

  // Check if user has purchased this product
  // Must have an order in a completed state
  const { data: purchase } = await supabase
    .from("order_items")
    .select(`
      id,
      order:orders!inner(user_id, status)
    `)
    .eq("product_id", productId)
    .eq("order.user_id", userId)
    .in("order.status", ["delivered", "shipped", "processing", "confirmed"])
    .limit(1)
    .single()

  return !!purchase
}
