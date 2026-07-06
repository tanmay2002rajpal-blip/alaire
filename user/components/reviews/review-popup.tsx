"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Star, BadgeCheck, X } from "lucide-react"

interface PopupReview {
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

// Timing (roughly matches the reference site: a new card every ~3-4s)
const INITIAL_DELAY = 3000
const VISIBLE_MS = 3500
const GAP_MS = 800
const DISMISS_KEY = "alaire_review_popup_dismissed"

/**
 * Rotating "customer review" social-proof popup shown bottom-left of the
 * storefront. Cycles through recent approved reviews, one at a time. Dismissed
 * for the rest of the session via the X button. Renders nothing when there are
 * no reviews (so it never shows an empty card).
 */
export function ReviewPopup() {
  const [reviews, setReviews] = useState<PopupReview[]>([])
  const [current, setCurrent] = useState<PopupReview | null>(null)
  const [visible, setVisible] = useState(false)
  // Lazy init (no setState-in-effect): dismissed if this session already closed
  // it. SSR returns false, but `current` starts null so nothing renders until
  // the cycle picks a review — no hydration mismatch.
  const [dismissed, setDismissed] = useState<boolean>(
    () => (typeof window === "undefined" ? false : !!sessionStorage.getItem(DISMISS_KEY)),
  )
  const idx = useRef(0)

  // Load reviews once, unless already dismissed this session.
  useEffect(() => {
    if (dismissed) return
    let active = true
    fetch("/api/reviews/recent")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PopupReview[]) => {
        if (active && Array.isArray(data)) setReviews(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [dismissed])

  // Drive the show / hide / advance cycle.
  useEffect(() => {
    if (dismissed || reviews.length === 0) return

    let active = true
    let showTimer: ReturnType<typeof setTimeout>
    let hideTimer: ReturnType<typeof setTimeout>

    const cycle = () => {
      if (!active) return
      setCurrent(reviews[idx.current % reviews.length])
      setVisible(true)
      hideTimer = setTimeout(() => {
        if (!active) return
        setVisible(false)
        idx.current += 1
        showTimer = setTimeout(cycle, GAP_MS)
      }, VISIBLE_MS)
    }

    const start = setTimeout(cycle, INITIAL_DELAY)
    return () => {
      active = false
      clearTimeout(start)
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [dismissed, reviews])

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    if (typeof window !== "undefined") sessionStorage.setItem(DISMISS_KEY, "1")
  }

  if (dismissed || !current) return null

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 hidden sm:block transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex w-[300px] items-stretch gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute right-1.5 top-1.5 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <Link href={`/products/${current.productSlug}`} className="flex flex-1 items-stretch gap-3">
          {/* Product thumbnail */}
          <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-muted">
            {current.productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.productImage}
                alt={current.productName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                {current.productName.slice(0, 12)}
              </div>
            )}
          </div>

          {/* Review body */}
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold">{current.name}</span>
              {current.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />}
            </div>
            <div className="mt-0.5 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < current.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
              &ldquo;{current.content}&rdquo;
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
