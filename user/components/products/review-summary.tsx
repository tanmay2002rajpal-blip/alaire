"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReviewSummaryProps {
  average: number
  count: number
  onClickScroll?: () => void
  size?: "sm" | "md"
}

export function ReviewSummary({ average, count, onClickScroll, size = "md" }: ReviewSummaryProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)

  if (count === 0) {
    return (
      <button
        onClick={onClickScroll}
        className={cn(
          "flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors",
          size === "sm" ? "text-sm" : "text-base"
        )}
      >
        <div className="flex">
          {stars.map((star) => (
            <Star
              key={star}
              className={cn(
                "text-muted-foreground/30",
                size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
              )}
            />
          ))}
        </div>
        <span>No reviews yet</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClickScroll}
      className={cn(
        "flex items-center gap-2 hover:opacity-80 transition-opacity",
        size === "sm" ? "text-sm" : "text-base"
      )}
    >
      <div className="flex">
        {stars.map((star) => (
          <Star
            key={star}
            className={cn(
              star <= Math.round(average)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30",
              size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
            )}
          />
        ))}
      </div>
      <span className="font-medium">{average.toFixed(1)}</span>
      <span className="text-muted-foreground">({count} {count === 1 ? "review" : "reviews"})</span>
    </button>
  )
}
