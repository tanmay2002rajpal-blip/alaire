# Phase 2: Social Proof & Engagement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add product reviews, recently viewed tracking, and newsletter subscription with welcome emails.

**Architecture:** Server actions for mutations, Supabase queries for data fetching, React Email + Resend for transactional emails. All features integrate with existing product page.

**Tech Stack:** Next.js 15, Supabase, React Email, Resend, shadcn/ui, GSAP

---

## Task 1: Install Email Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install resend and react-email packages**

Run:
```bash
npm install resend @react-email/components
```

**Step 2: Verify installation**

Run: `npm ls resend @react-email/components`
Expected: Both packages listed without errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add resend and react-email dependencies"
```

---

## Task 2: Create Newsletter Server Action

**Files:**
- Create: `lib/actions/newsletter.ts`

**Step 1: Create the server action**

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SubscribeResult {
  success: boolean
  error?: string
}

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email address" }
  }

  const supabase = await createClient()

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, is_active")
    .eq("email", email.toLowerCase())
    .single()

  if (existing?.is_active) {
    return { success: false, error: "Email already subscribed" }
  }

  // Insert or reactivate subscription
  const { error: dbError } = await supabase
    .from("newsletter_subscribers")
    .upsert({
      email: email.toLowerCase(),
      is_active: true,
      subscribed_at: new Date().toISOString(),
      unsubscribed_at: null,
    }, { onConflict: "email" })

  if (dbError) {
    console.error("Newsletter subscription error:", dbError)
    return { success: false, error: "Failed to subscribe. Please try again." }
  }

  // Send welcome email (don't fail subscription if email fails)
  try {
    await resend.emails.send({
      from: "Alaire <noreply@alaire.com>",
      to: email.toLowerCase(),
      subject: "Welcome to Alaire",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 28px; margin-bottom: 20px;">Welcome to Alaire</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Thank you for subscribing to our newsletter. You'll be the first to know about:
          </p>
          <ul style="font-size: 16px; line-height: 1.8; color: #333;">
            <li>New arrivals and collections</li>
            <li>Exclusive offers and promotions</li>
            <li>Curated style guides</li>
          </ul>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If you didn't subscribe, you can safely ignore this email.
          </p>
        </div>
      `,
    })
  } catch (emailError) {
    console.error("Welcome email failed:", emailError)
    // Don't return error - subscription succeeded
  }

  return { success: true }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/actions/newsletter.ts
git commit -m "feat(newsletter): add subscription server action with Resend"
```

---

## Task 3: Connect Newsletter Form to Server Action

**Files:**
- Modify: `components/layout/newsletter-form.tsx`

**Step 1: Update the form to call the server action**

Replace the `handleSubmit` function and add import:

```typescript
// Add at top of file
import { subscribeToNewsletter } from "@/lib/actions/newsletter"

// Replace handleSubmit function
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!email) return

  setStatus("loading")

  const result = await subscribeToNewsletter(email)

  if (result.success) {
    setStatus("success")
    setEmail("")

    // Animate success message
    if (successRef.current) {
      gsap.fromTo(
        successRef.current,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      )
    }

    setTimeout(() => setStatus("idle"), 4000)
  } else {
    setStatus("error")
    setTimeout(() => setStatus("idle"), 4000)
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/layout/newsletter-form.tsx
git commit -m "feat(newsletter): connect form to subscription action"
```

---

## Task 4: Create Recently Viewed Server Action

**Files:**
- Create: `lib/actions/recently-viewed.ts`

**Step 1: Create the server action**

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"

export async function trackProductView(productId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Upsert the view record
  await supabase
    .from("recently_viewed")
    .upsert({
      user_id: user.id,
      product_id: productId,
      viewed_at: new Date().toISOString(),
    }, { onConflict: "user_id,product_id" })
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/actions/recently-viewed.ts
git commit -m "feat(recently-viewed): add product view tracking action"
```

---

## Task 5: Add Recently Viewed Query

**Files:**
- Modify: `lib/supabase/queries.ts`

**Step 1: Add the query function**

Add to the file:

```typescript
export async function getRecentlyViewed(userId: string, excludeProductId?: string, limit = 4): Promise<Product[]> {
  const supabase = await createClient()

  let query = supabase
    .from("recently_viewed")
    .select(`
      product:products(*)
    `)
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit + 1) // Fetch one extra in case we need to exclude current

  const { data, error } = await query

  if (error || !data) return []

  // Extract products and filter out excluded + inactive
  const products = data
    .map((item: any) => item.product)
    .filter((p: Product | null): p is Product =>
      p !== null &&
      p.is_active &&
      p.id !== excludeProductId
    )
    .slice(0, limit)

  return products
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/supabase/queries.ts
git commit -m "feat(recently-viewed): add query for fetching viewed products"
```

---

## Task 6: Create Recently Viewed Component

**Files:**
- Create: `components/products/recently-viewed.tsx`

**Step 1: Create the component**

```typescript
import { getRecentlyViewed } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
import { ProductGrid } from "./product-grid"

interface RecentlyViewedProps {
  excludeProductId: string
}

export async function RecentlyViewed({ excludeProductId }: RecentlyViewedProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const products = await getRecentlyViewed(user.id, excludeProductId, 4)

  if (products.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="mb-8 text-2xl font-bold tracking-tight">
        Recently Viewed
      </h2>
      <ProductGrid products={products} columns={4} />
    </section>
  )
}
```

**Step 2: Export from index**

Add to `components/products/index.ts`:

```typescript
export { RecentlyViewed } from "./recently-viewed"
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/products/recently-viewed.tsx components/products/index.ts
git commit -m "feat(recently-viewed): add display component"
```

---

## Task 7: Integrate Recently Viewed into Product Page

**Files:**
- Modify: `app/(store)/products/[slug]/page.tsx`

**Step 1: Add tracking and display**

Add import:
```typescript
import { RecentlyViewed } from "@/components/products"
import { trackProductView } from "@/lib/actions/recently-viewed"
```

Add tracking call after getting product (before return):
```typescript
// Track product view (fire and forget)
trackProductView(product.id)
```

Add Recently Viewed section after Related Products (before closing `</div>`):
```typescript
{/* Recently Viewed */}
<RecentlyViewed excludeProductId={product.id} />
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(store)/products/[slug]/page.tsx
git commit -m "feat(recently-viewed): integrate tracking and display on product page"
```

---

## Task 8: Add Review Queries

**Files:**
- Modify: `lib/supabase/queries.ts`

**Step 1: Add review query functions**

Add to the file:

```typescript
import type { ReviewWithUser } from "@/types"

export interface ReviewSummary {
  average: number
  count: number
}

export async function getProductReviews(productId: string): Promise<ReviewWithUser[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      user:profiles(full_name, avatar_url)
    `)
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (error || !data) return []

  return data as ReviewWithUser[]
}

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_approved", true)

  if (error || !data || data.length === 0) {
    return { average: 0, count: 0 }
  }

  const sum = data.reduce((acc, r) => acc + r.rating, 0)
  return {
    average: Math.round((sum / data.length) * 10) / 10,
    count: data.length,
  }
}

export async function canUserReview(userId: string, productId: string): Promise<boolean> {
  const supabase = await createClient()

  // Check if user has already reviewed
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single()

  if (existingReview) return false

  // Check if user has purchased this product
  const { data: purchase } = await supabase
    .from("order_items")
    .select(`
      id,
      order:orders!inner(user_id, status)
    `)
    .eq("product_id", productId)
    .eq("order.user_id", userId)
    .in("order.status", ["delivered", "shipped", "processing", "confirmed"])
    .limit(1)
    .single()

  return !!purchase
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/supabase/queries.ts
git commit -m "feat(reviews): add queries for reviews, summary, and eligibility"
```

---

## Task 9: Create Reviews Server Action

**Files:**
- Create: `lib/actions/reviews.ts`

**Step 1: Create the server action**

```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/actions/reviews.ts
git commit -m "feat(reviews): add review submission server action"
```

---

## Task 10: Create Review Summary Component

**Files:**
- Create: `components/products/review-summary.tsx`

**Step 1: Create the component**

```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/products/review-summary.tsx
git commit -m "feat(reviews): add review summary component with stars"
```

---

## Task 11: Create Review Card Component

**Files:**
- Create: `components/products/review-card.tsx`

**Step 1: Create the component**

```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/products/review-card.tsx
git commit -m "feat(reviews): add review card component"
```

---

## Task 12: Create Review List Component

**Files:**
- Create: `components/products/review-list.tsx`

**Step 1: Create the component**

```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/products/review-list.tsx
git commit -m "feat(reviews): add review list component"
```

---

## Task 13: Create Review Form Component

**Files:**
- Create: `components/products/review-form.tsx`

**Step 1: Create the component**

```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/products/review-form.tsx
git commit -m "feat(reviews): add review form modal component"
```

---

## Task 14: Export Review Components

**Files:**
- Modify: `components/products/index.ts`

**Step 1: Add exports**

Add to the file:

```typescript
export { ReviewSummary } from "./review-summary"
export { ReviewList } from "./review-list"
export { ReviewCard } from "./review-card"
export { ReviewForm } from "./review-form"
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/products/index.ts
git commit -m "feat(reviews): export review components"
```

---

## Task 15: Create Product Reviews Section Wrapper

**Files:**
- Create: `app/(store)/products/[slug]/product-reviews.tsx`

**Step 1: Create the client wrapper component**

```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(store)/products/[slug]/product-reviews.tsx
git commit -m "feat(reviews): add product reviews client wrapper"
```

---

## Task 16: Integrate Reviews into Product Page

**Files:**
- Modify: `app/(store)/products/[slug]/page.tsx`

**Step 1: Add imports**

```typescript
import { ReviewSummary } from "@/components/products"
import { getProductReviews, getReviewSummary, canUserReview } from "@/lib/supabase/queries"
import { ProductReviews } from "./product-reviews"
```

**Step 2: Fetch review data**

Add after `relatedProducts` fetch:

```typescript
const [reviewsData, summaryData] = await Promise.all([
  getProductReviews(product.id),
  getReviewSummary(product.id),
])

// Check if current user can review
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
const userCanReview = user ? await canUserReview(user.id, product.id) : false
```

Add import at top:
```typescript
import { createClient } from "@/lib/supabase/server"
```

**Step 3: Add Review Summary to product info area**

After breadcrumb nav, before the product grid, add scroll function and summary display in the ProductInfo area. Add the review summary inside a wrapper after price or where appropriate in ProductInfo (this may require passing it as a prop or rendering it separately).

For simplicity, add it right after the product grid section:

```typescript
{/* Review Summary - scroll link */}
<div className="mt-4">
  <ReviewSummary
    average={summaryData.average}
    count={summaryData.count}
    onClickScroll={() => {
      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })
    }}
  />
</div>
```

**Step 4: Add Reviews Section**

After Related Products section, before the Recently Viewed:

```typescript
<Separator className="my-16" />

{/* Customer Reviews */}
<section>
  <ProductReviews
    productId={product.id}
    reviews={reviewsData}
    average={summaryData.average}
    count={summaryData.count}
    canReview={userCanReview}
  />
</section>
```

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add app/(store)/products/[slug]/page.tsx
git commit -m "feat(reviews): integrate reviews section into product page"
```

---

## Task 17: Final Build Verification

**Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 3: Manual testing checklist**

- [ ] Newsletter: Enter email, submit, verify toast + database entry
- [ ] Recently Viewed: View product while logged in, check another product for "Recently Viewed" section
- [ ] Reviews: As verified purchaser, submit review, verify it appears

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 2 - reviews, recently viewed, newsletter"
```

---

## Summary

| Task | Feature | Files |
|------|---------|-------|
| 1 | Setup | Install dependencies |
| 2-3 | Newsletter | Server action + form integration |
| 4-7 | Recently Viewed | Action + query + component + integration |
| 8-16 | Reviews | Queries + action + 5 components + integration |
| 17 | Verification | Build + manual test |

**Total: 17 tasks**
