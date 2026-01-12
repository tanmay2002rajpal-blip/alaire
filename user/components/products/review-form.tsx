"use client"

import { useState } from "react"
import { Star, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { submitReview } from "@/lib/actions/reviews"
import { toast } from "sonner"

interface ReviewFormProps {
  productId: string
  onClose: () => void
  onSuccess: () => void
}

export function ReviewForm({ productId, onClose, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stars = Array.from({ length: 5 }, (_, i) => i + 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    if (content.trim().length < 10) {
      toast.error("Review must be at least 10 characters")
      return
    }

    setIsSubmitting(true)

    const result = await submitReview({
      productId,
      rating,
      title: title.trim() || undefined,
      content: content.trim(),
    })

    setIsSubmitting(false)

    if (result.success) {
      toast.success("Thank you for your review!")
      onSuccess()
      onClose()
    } else {
      toast.error(result.error || "Failed to submit review")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg bg-background p-6 shadow-lg mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-semibold mb-6">Write a Review</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {stars.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your experience"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Review <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/1000 characters
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
