# Alaire Homepage Redesign — Jockey-Inspired

**Date:** 2026-03-26
**Status:** Approved

## Goal

Redesign the Alaire user-facing homepage to match the interactive, slider-driven patterns seen on Jockey.in. Replace static grids with swipeable Embla carousels, add category quick-links, tabbed New Arrivals and Best Sellers sections, and convert the Instagram feed to a carousel.

## New Homepage Section Order

| # | Section | Replaces | Data Source |
|---|---------|----------|-------------|
| 1 | Hero Carousel | (keep as-is) | `getHeroSlides()` |
| 2 | Category Quick-Links | (new) | `getCategories()` |
| 3 | On-Trend Picks Carousel | CategoryGrid | `getCategoriesWithCounts()` |
| 4 | New Arrivals (tabbed carousel) | FeaturedProducts | `getNewArrivals()` (new query) |
| 5 | Best Sellers (tabbed carousel) | (new) | `getBestSellers()` (new query) |
| 6 | Newsletter | (keep as-is) | — |
| 7 | Instagram Feed Carousel | InstagramFeed (static grid) | existing Instagram data |

**Removed:** HeroSection (stats counters) — doesn't drive purchases.
**Reordered:** Newsletter moves before Instagram Feed (was after it previously).

## Technical Decisions

### Carousel Library: Embla Carousel

- Package: `embla-carousel-react` + `embla-carousel-autoplay`
- ~3KB gzipped, touch-first, React-native integration
- Hero carousel stays GSAP-based (complex fade/Ken Burns animations)
- All other carousels use Embla for consistency

### Shared Carousel Component

A single reusable `<EmblaCarousel>` component handles:
- Responsive slides-per-view via CSS flex-basis
- Prev/Next arrow buttons (consistent circle style)
- Dot pagination
- Optional autoplay and loop
- ARIA labels for accessibility

## Section Specifications

### 1. Hero Carousel — No Changes

Keep existing GSAP-based hero carousel. Already has crossfade transitions, Ken Burns, progress bar, mobile dots.

### 2. Category Quick-Links (NEW)

- **Data:** `getCategories()` — all active categories
- **Desktop:** Horizontal centered row, circular images (80px diameter), category name below in DM Sans 500
- **Mobile:** Horizontally scrollable row (CSS overflow-x: auto, no scrollbar), ~4.5 icons visible, edge fade gradient hint
- **Style:** `category.image_url` cropped to circle, 2px border in accent color (`--accent`), subtle hover scale (1.05)
- **Fallback:** If `image_url` is null, show a colored circle with the category initial letter (accent background, white text)
- **Placement:** Directly below hero with reduced section padding

### 3. On-Trend Picks Carousel (REPLACES CategoryGrid)

- **Data:** `getCategoriesWithCounts()` — categories with product counts
- **Desktop:** Embla carousel, 3 slides visible + ~20% peek of next slide, prev/next arrows
- **Mobile:** 1.2 slides visible, swipe gesture, dot pagination below
- **Card Design:**
  - Full category image, aspect ratio 3:4
  - Category name overlaid at bottom with glass blur background
  - Product count badge (e.g., "24 Products")
  - **Fallback:** If `image_url` is null, use a gradient placeholder with category initial
- **Header:** "On-Trend Picks" (Cormorant Garamond h2), subtitle "Explore Our Collections"

### 4. New Arrivals — Tabbed Carousel (REPLACES FeaturedProducts)

- **Data:** New query `getNewArrivals(categoryId?, limit=12)`
  - Products sorted by `created_at: -1`
  - Filtered to products created within last 30 days
  - Falls back to newest products if fewer than 4 in 30-day window
- **Tabs:** Category tabs — "All" + each active category from `getCategories()`
  - Desktop: Right-aligned next to heading
  - Mobile: Horizontally scrollable below heading
  - Active tab: underline style in accent color
- **Carousel:**
  - Desktop: 4 product cards visible + peek, prev/next arrows
  - Mobile: 1.5 cards visible, swipeable, dot pagination
- **Card:** Existing `ProductCard` component (has New badge, discount %, wishlist, quick add)
- **Header:** "New Arrivals" (Cormorant Garamond h2)
- **Interaction:** Tab click filters carousel content. `page.tsx` calls `getNewArrivals(undefined, 12)` once on the server (no category filter). The component receives all 12 products and filters client-side by `category_id` for instant tab switching. The `categoryId` parameter on the query exists for potential API route use.
- **Empty states:** If a tab yields zero products, show "No products in this category" message. If carousel has fewer items than visible slide count, disable loop, hide arrows, and let items fill available space.

### 5. Best Sellers — Tabbed Carousel (NEW)

- **Data:** New query `getBestSellers(categoryId?, limit=12)`
  - Aggregates reviews collection: group by `product_id`, count reviews, sort by count descending
  - Must convert `product_id` strings to ObjectId via `$toObjectId` before `$lookup` to products (reviews store product_id as string, products use ObjectId `_id`)
  - Joins with products collection to return full product data
  - Falls back to newest products if no reviews exist
  - Same server-side fetch pattern as New Arrivals: `getBestSellers(undefined, 12)` called once, filtered client-side by category
- **Tabs:** Same category tab pattern as New Arrivals
- **Carousel:** Identical layout to New Arrivals for consistency
- **Card:** Existing `ProductCard` component
- **Header:** "Best Sellers" (Cormorant Garamond h2), subtitle "Most Loved Styles"

### 6. Newsletter — No Changes

Keep existing dark background newsletter CTA section.

### 7. Instagram Feed Carousel (MODIFY)

- **Current:** Static 6-column grid
- **New:** Embla carousel
  - Desktop: 4 images visible + peek
  - Mobile: 2.5 images visible, swipeable
- **Header:** "Follow Our Journey" or keep existing
- **Note:** Instagram credentials are not currently configured; section uses placeholder images. Carousel conversion applies to whatever data source is present (placeholders or live API).

## New Database Queries

### `getNewArrivals(categoryId?: string, limit: number = 12)`

```typescript
// In user/lib/db/queries/products.ts
// Sort by created_at desc, optionally filter by category_id
// Filter: created_at >= 30 days ago (with fallback)
// Returns: ProductWithRelations[]
```

### `getBestSellers(categoryId?: string, limit: number = 12)`

```typescript
// In user/lib/db/queries/products.ts
// Aggregate reviews collection:
//   { $match: { is_approved: true } }
//   { $group: { _id: "$product_id", count: { $sum: 1 } } }
//   { $sort: { count: -1 } }
//   { $limit: limit }
//   { $addFields: { product_oid: { $toObjectId: "$_id" } } }  // convert string to ObjectId
//   { $lookup: { from: "products", localField: "product_oid", foreignField: "_id", as: "product" } }
// Optionally filter by category_id if provided
// Returns: ProductWithRelations[]
```

## Files to Create

| File | Purpose |
|------|---------|
| `user/components/ui/embla-carousel.tsx` | Reusable Embla carousel wrapper with arrows, dots, responsive config |
| `user/components/home/category-quick-links.tsx` | Circular category icons below hero |
| `user/components/home/on-trend-picks.tsx` | Category image carousel |
| `user/components/home/new-arrivals.tsx` | Tabbed product carousel |
| `user/components/home/best-sellers.tsx` | Tabbed product carousel (best reviewed) |
| `user/components/home/category-tabs.tsx` | Shared tab filter component for New Arrivals & Best Sellers |

## Files to Modify

| File | Changes |
|------|---------|
| `user/app/(store)/page.tsx` | New section order, new data fetching (getNewArrivals, getBestSellers), remove stats/hero-section |
| `user/lib/db/queries/products.ts` | Add getNewArrivals(), getBestSellers() |
| `user/components/home/instagram-feed.tsx` | Convert from grid to Embla carousel |
| `user/package.json` | Add embla-carousel-react, embla-carousel-autoplay |

## Files to Remove

| File | Reason |
|------|--------|
| `user/components/home/featured-products.tsx` | Replaced by new-arrivals.tsx |
| `user/components/home/category-grid.tsx` | Replaced by on-trend-picks.tsx |
| `user/components/home/hero-section.tsx` | Stats section removed |

## Design Tokens (unchanged)

- Section heading: Cormorant Garamond 600, `clamp(1.875rem, 4vw, 3rem)`
- Body/tabs: DM Sans 500
- Accent: `--accent` (#B8A88A light / #C4B49A dark)
- Section spacing: `--spacing-section` clamp(4rem, 8vw, 8rem)
- Card shadows: `--shadow-md`
- Carousel arrows: 40px circle, border, accent background on hover
- Carousel dots: 8px circles, accent fill for active
- Entrance animations: GSAP ScrollTrigger fade-up on each section

## Accessibility

- Embla carousel has proper ARIA: `role="region"`, `aria-roledescription="carousel"`, `aria-label` per section
- Arrow buttons: `aria-label="Previous slide"` / `"Next slide"`
- Dots: `aria-label="Go to slide N"`
- Tab buttons: `role="tablist"` / `role="tab"` / `aria-selected`
- Reduced motion: respect `prefers-reduced-motion` — disable autoplay, use instant transitions
