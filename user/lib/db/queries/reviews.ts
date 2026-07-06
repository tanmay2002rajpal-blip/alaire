import { ObjectId } from "mongodb"
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
    const userObjectIds = userIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id))
    const profiles = await db
      .collection("users")
      .find({ _id: { $in: userObjectIds } })
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

// ============================================================================
// Social-proof popup: recent approved reviews across all products
// ============================================================================

export interface PopupReview {
  id: string
  name: string
  avatar: string | null
  rating: number
  content: string
  productName: string
  productSlug: string
  productImage: string | null
  verified: boolean
}

/**
 * Recent approved reviews (any product) for the storefront's rotating
 * "customer review" popup. Joins product name/image and a privacy-trimmed
 * reviewer name (first name + last initial). Returns [] when there are none.
 */
export async function getRecentReviewsForPopup(limit = 20): Promise<PopupReview[]> {
  const db = await getDb()

  const reviews = await db
    .collection("reviews")
    .find({ is_approved: true })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray()

  if (reviews.length === 0) return []

  // Products (name, slug, first image)
  const productIds = [...new Set(reviews.map((r) => r.product_id).filter(Boolean))]
  const productObjectIds = productIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id))
  const products = productObjectIds.length
    ? await db
        .collection("products")
        .find({ _id: { $in: productObjectIds } })
        .project({ name: 1, slug: 1, images: 1 })
        .toArray()
    : []
  const productMap = products.reduce((acc, p) => {
    acc[p._id.toString()] = {
      name: p.name as string,
      slug: p.slug as string,
      image: Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as string) : null,
    }
    return acc
  }, {} as Record<string, { name: string; slug: string; image: string | null }>)

  // Reviewers (privacy-trimmed name + avatar)
  const userIds = [...new Set(reviews.map((r) => r.user_id).filter(Boolean))]
  const userObjectIds = userIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id))
  const users = userObjectIds.length
    ? await db
        .collection("users")
        .find({ _id: { $in: userObjectIds } })
        .project({ full_name: 1, name: 1, avatar_url: 1, image: 1 })
        .toArray()
    : []
  const userMap = users.reduce((acc, u) => {
    acc[u._id.toString()] = {
      name: (u.full_name || u.name || null) as string | null,
      avatar: (u.avatar_url || u.image || null) as string | null,
    }
    return acc
  }, {} as Record<string, { name: string | null; avatar: string | null }>)

  return reviews
    .map((r) => {
      const product = productMap[r.product_id]
      if (!product) return null // orphaned review — skip

      const u = userMap[r.user_id] || { name: null, avatar: null }
      const full = (u.name || "Verified Buyer").trim()
      const parts = full.split(/\s+/)
      const display = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]

      return {
        id: r._id.toString(),
        name: display,
        avatar: u.avatar,
        rating: r.rating,
        content: r.content,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.image,
        verified: !!r.is_verified_purchase,
      }
    })
    .filter(Boolean) as PopupReview[]
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

  // Any logged-in user can review
  return true
}
