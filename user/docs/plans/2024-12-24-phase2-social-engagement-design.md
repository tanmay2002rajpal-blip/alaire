# Phase 2: Social Proof & Engagement - Design

**Date:** 2024-12-24
**Status:** Approved
**Goal:** Add product reviews, recently viewed tracking, and newsletter subscription.

---

## Feature 1: Product Reviews

### Overview
Customer reviews on product pages with rating summary and full review list. Verified purchasers only. Auto-approved, text-only format.

### Display Layout

**Rating Summary (Product Info Section)**
- Average star rating with filled/empty stars
- Total review count: "4.5 ★ (23 reviews)"
- Clicking scrolls to reviews section

**Reviews Section (Below Product Tabs)**
- Header: "Customer Reviews" with average + count
- Review list showing:
  - Star rating (1-5 filled stars)
  - Title (bold) + content
  - Author name + "Verified Purchase" badge + date
- "Write a Review" button (verified purchasers only)
- Empty state message

### Submission Flow
- Eligibility: logged in + purchased product + not reviewed yet
- Modal form: star rating (required) + title (optional) + content (required)
- Auto-sets `is_verified_purchase = true`, `is_approved = true`
- Toast confirmation, modal closes, list refreshes

### Files
| Action | Path |
|--------|------|
| Create | `components/products/review-summary.tsx` |
| Create | `components/products/review-list.tsx` |
| Create | `components/products/review-card.tsx` |
| Create | `components/products/review-form.tsx` |
| Create | `lib/actions/reviews.ts` |
| Modify | `app/(store)/products/[slug]/page.tsx` |
| Modify | `lib/supabase/queries.ts` |
| Modify | `components/products/index.ts` |

---

## Feature 2: Recently Viewed

### Overview
Track and display recently viewed products for logged-in users on product pages.

### Display
- Section below "Related Products" on product page
- Header: "Recently Viewed"
- Shows last 4 viewed products (excluding current)
- Uses existing `ProductGrid` component
- Hidden if not logged in or no history

### Tracking
- Upsert into `recently_viewed` table on product page view
- Updates `viewed_at` timestamp if exists
- Server action called from product page

### Files
| Action | Path |
|--------|------|
| Create | `components/products/recently-viewed.tsx` |
| Create | `lib/actions/recently-viewed.ts` |
| Modify | `lib/supabase/queries.ts` |
| Modify | `app/(store)/products/[slug]/page.tsx` |

---

## Feature 3: Newsletter Backend

### Overview
Connect existing newsletter UI to Supabase + send welcome emails via Resend.

### Subscription Flow
1. User enters email in existing form
2. Server action validates email
3. Insert/upsert into `newsletter_subscribers` table
4. Send welcome email via Resend
5. Return success/error to form

### Welcome Email
- Subject: "Welcome to Alaire"
- Branded template with thank you, expectations, unsubscribe link

### Files
| Action | Path |
|--------|------|
| Create | `lib/actions/newsletter.ts` |
| Create | `emails/welcome.tsx` |
| Modify | `components/layout/newsletter-form.tsx` |

### Dependencies
- `resend` - Email API
- `@react-email/components` - Email templates

### Environment
- `RESEND_API_KEY` in `.env.local`

---

## Summary

| Feature | New Files | Modified Files |
|---------|-----------|----------------|
| Reviews | 5 | 3 |
| Recently Viewed | 2 | 2 |
| Newsletter | 2 | 1 |
| **Total** | **9** | **6** |

---

## Next Steps
1. Create implementation plan with task breakdown
2. Install dependencies (resend, @react-email/components)
3. Implement in order: Newsletter → Recently Viewed → Reviews
