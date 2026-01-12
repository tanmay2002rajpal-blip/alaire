# Phase 2: Product Reviews - Design

**Date:** 2024-12-24
**Status:** Approved
**Goal:** Add product reviews with star ratings for verified purchasers.

---

## Overview

Customer reviews displayed on product pages with rating summary and full review list. Only verified purchasers can submit reviews. Auto-approved, text-only format.

---

## Display Layout

### Rating Summary (Product Info Section)
- Average star rating with filled/empty stars visual
- Total review count: "4.5 ★ (23 reviews)"
- Clicking scrolls to reviews section below

### Reviews Section (Below Product Tabs)
- Section header: "Customer Reviews" with average + count
- List of reviews showing:
  - Star rating (1-5 filled stars)
  - Review title (bold)
  - Review content
  - Author name + "Verified Purchase" badge
  - Date posted
- "Write a Review" button (visible only to verified purchasers)
- Empty state: "No reviews yet. Be the first to review this product!"

---

## Review Submission

### Eligibility
- User must be logged in
- User must have purchased the product (check `order_items`)
- User must not have already reviewed this product

### Form (Modal Dialog)
- Star rating selector (click to rate 1-5, required)
- Title input (optional, max 100 chars)
- Content textarea (required, min 10 chars, max 1000 chars)
- Submit button with loading state

### After Submission
- Server action inserts into `reviews` table
- Sets `is_verified_purchase = true`, `is_approved = true`
- Toast: "Thank you for your review!"
- Modal closes, list refreshes with new review at top

---

## Files

### New Files
| Path | Purpose |
|------|---------|
| `components/products/review-summary.tsx` | Star rating + count display |
| `components/products/review-list.tsx` | List of reviews with empty state |
| `components/products/review-card.tsx` | Single review display |
| `components/products/review-form.tsx` | Modal form for submission |
| `lib/actions/reviews.ts` | Server actions: submit, check eligibility |

### Modified Files
| Path | Change |
|------|--------|
| `app/(store)/products/[slug]/page.tsx` | Add reviews section |
| `lib/supabase/queries.ts` | Add review queries |
| `components/products/index.ts` | Export new components |

---

## Queries

```typescript
// Fetch reviews with user profiles
getProductReviews(productId: string): Promise<ReviewWithUser[]>

// Get average rating and count
getReviewSummary(productId: string): Promise<{ average: number; count: number }>

// Check if user can review (has purchased, hasn't reviewed)
canUserReview(userId: string, productId: string): Promise<boolean>
```

---

## Database

Existing `reviews` table schema:
- `id`, `user_id`, `product_id`
- `rating` (1-5)
- `title`, `content`
- `is_verified_purchase`, `is_approved`
- `created_at`, `updated_at`

No migrations needed - table already exists.
