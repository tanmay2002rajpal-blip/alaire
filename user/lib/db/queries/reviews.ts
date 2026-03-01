import { getDb } from "../client"
import { serializeDocs } from "../helpers"
import type { ReviewWithUser } from "@/types"

// ============================================================================
// Types
// ============================================================================

export interface ReviewSummary {
  average: number
  count: number
}

// ============================================================================
// Queries
// ============================================================================

export async function getProductReviews(
  productId: string
): Promise<ReviewWithUser[]> {
  const db = await getDb()

  const reviews = await db
    .collection("reviews")
    .find({ product_id: productId, is_approved: true })
    .sort({ created_at: -1 })
    .toArray()

  if (reviews.length === 0) return []

  const userIds = [...new Set(reviews.map((r) => r.user_id).filter(Boolean))]

  let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {}
  if (userIds.length > 0) {
    const profiles = await db
      .collection("users")
      .find({ $expr: { $in: [{ $toString: "$_id" }, userIds] } })
      .project({ full_name: 1, name: 1, avatar_url: 1, image: 1 })
      .toArray()

    profilesMap = profiles.reduce((acc, p) => {
      acc[p._id.toString()] = {
        full_name: p.full_name || p.name || null,
        avatar_url: p.avatar_url || p.image || null,
      }
      return acc
    }, {} as typeof profilesMap)
  }

  return serializeDocs(reviews).map((review) => ({
    ...review,
    user: profilesMap[review.user_id] || { full_name: "Anonymous", avatar_url: null },
  })) as unknown as ReviewWithUser[]
}

export async function getReviewSummary(
  productId: string
): Promise<ReviewSummary> {
  const db = await getDb()

  const reviews = await db
    .collection("reviews")
    .find({ product_id: productId, is_approved: true })
    .project({ rating: 1 })
    .toArray()

  if (reviews.length === 0) {
    return { average: 0, count: 0 }
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  }
}

export async function canUserReview(
  userId: string,
  productId: string
): Promise<boolean> {
  const db = await getDb()

  // Check if already reviewed
  const existingReview = await db
    .collection("reviews")
    .findOne({ user_id: userId, product_id: productId })

  if (existingReview) return false

  // Check if user has purchased this product
  const orderItems = await db
    .collection("order_items")
    .find({ product_id: productId })
    .toArray()

  if (orderItems.length === 0) return false

  const orderIds = orderItems.map((oi) => oi.order_id)

  const purchase = await db.collection("orders").findOne({
    $expr: { $in: [{ $toString: "$_id" }, orderIds] },
    user_id: userId,
    status: { $in: ["delivered", "shipped", "processing", "confirmed"] },
  })

  return !!purchase
}
