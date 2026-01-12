import { Star, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReviewWithUser } from "@/types"

interface ReviewCardProps {
  review: ReviewWithUser
}

export function ReviewCard({ review }: ReviewCardProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="border-b border-border py-6 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {stars.map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    star <= review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          {review.title && (
            <h4 className="font-semibold mb-1">{review.title}</h4>
          )}

          {/* Content */}
          <p className="text-muted-foreground leading-relaxed">{review.content}</p>

          {/* Author & Date */}
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {review.user?.full_name || "Anonymous"}
            </span>
            {review.is_verified_purchase && (
              <span className="flex items-center gap-1 text-green-600">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified Purchase
              </span>
            )}
            <span>•</span>
            <span>{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
