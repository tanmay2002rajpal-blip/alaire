"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ReviewList, ReviewForm } from "@/components/products"
import type { ReviewWithUser } from "@/types"

interface ProductReviewsProps {
  productId: string
  reviews: ReviewWithUser[]
  average: number
  count: number
  canReview: boolean
}

export function ProductReviews({ productId, reviews, average, count, canReview }: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <ReviewList
        reviews={reviews}
        average={average}
        count={count}
        canReview={canReview}
        onWriteReview={() => setShowForm(true)}
      />
      {showForm && (
        <ReviewForm
          productId={productId}
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
