"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { canUserReview } from "@/lib/supabase/queries"

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "You must be logged in to submit a review" }
  }

  // Validate input
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

  // Check eligibility
  const eligible = await canUserReview(user.id, input.productId)
  if (!eligible) {
    return { success: false, error: "You must purchase this product to leave a review" }
  }

  // Insert review
  const { error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      product_id: input.productId,
      rating: input.rating,
      title: input.title?.trim() || null,
      content: input.content.trim(),
      is_verified_purchase: true,
      is_approved: true,
    })

  if (error) {
    console.error("Review submission error:", error)
    return { success: false, error: "Failed to submit review. Please try again." }
  }

  // Revalidate product page
  revalidatePath(`/products/[slug]`, "page")

  return { success: true }
}
