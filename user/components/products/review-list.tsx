import { ReviewCard } from "./review-card"
import { ReviewSummary } from "./review-summary"
import type { ReviewWithUser } from "@/types"

interface ReviewListProps {
  reviews: ReviewWithUser[]
  average: number
  count: number
  canReview: boolean
  onWriteReview?: () => void
}

export function ReviewList({ reviews, average, count, canReview, onWriteReview }: ReviewListProps) {
  return (
    <div id="reviews" className="scroll-mt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Customer Reviews</h2>
          <ReviewSummary average={average} count={count} />
        </div>
        {canReview && (
          <button
            onClick={onWriteReview}
            className="px-6 py-2.5 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Reviews or Empty State */}
      {reviews.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}
