"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { canUserReview } from "@/lib/db/queries"

export interface SubmitReviewInput {
  productId: string
  rating: number
  title?: string
  content: string
}

export interface SubmitReviewResult {
  success: boolean
  error?: string
}

export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in to submit a review" }
  }

  if (input.rating < 1 || input.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" }
  }

  if (!input.content || input.content.trim().length < 10) {
    return { success: false, error: "Review must be at least 10 characters" }
  }

  if (input.content.length > 1000) {
    return { success: false, error: "Review must be less than 1000 characters" }
  }

  if (input.title && input.title.length > 100) {
    return { success: false, error: "Title must be less than 100 characters" }
  }

  const eligible = await canUserReview(session.user.id, input.productId)
  if (!eligible) {
    return { success: false, error: "You have already reviewed this product" }
  }

  const db = await getDb()

  await db.collection("reviews").insertOne({
    user_id: session.user.id,
    product_id: input.productId,
    rating: input.rating,
    title: input.title?.trim() || null,
    content: input.content.trim(),
    is_verified_purchase: false,
    is_approved: true,
    created_at: new Date(),
  })

  revalidatePath(`/products/[slug]`, "page")

  return { success: true }
}
