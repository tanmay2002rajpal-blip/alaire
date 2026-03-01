import { getDb } from "../client"
import { serializeDocs } from "../helpers"

// ============================================================================
// Types
// ============================================================================

export interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string
  button_text: string | null
  button_link: string | null
  position: number
  is_active: boolean
}

export interface HomepageStats {
  productCount: number
  categoryCount: number
  averageRating: number
  customerCount: number
}

// ============================================================================
// Queries
// ============================================================================

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const db = await getDb()

  const docs = await db
    .collection("hero_slides")
    .find({ is_active: true })
    .sort({ position: 1 })
    .toArray()

  return serializeDocs(docs) as unknown as HeroSlide[]
}

export async function getHomepageStats(): Promise<HomepageStats> {
  const db = await getDb()

  const [productCount, categoryCount, reviews, customerCount] = await Promise.all([
    db.collection("products").countDocuments({ is_active: true }),
    db.collection("categories").countDocuments({ is_active: true }),
    db
      .collection("reviews")
      .find({ is_approved: true })
      .project({ rating: 1 })
      .toArray(),
    db.collection("orders").countDocuments({ status: "delivered" }),
  ])

  let averageRating = 0
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0)
    averageRating = Math.round((sum / reviews.length) * 10) / 10
  }

  return {
    productCount,
    categoryCount,
    averageRating,
    customerCount,
  }
}
