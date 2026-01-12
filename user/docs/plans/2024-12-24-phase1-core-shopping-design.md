# Phase 1: Core Shopping Experience - Design

**Date:** 2024-12-24
**Status:** Approved
**Goal:** Complete essential shopping flow with search, categories, and order tracking.

---

## Feature 1: Search Dialog

### Overview
Command palette style search (like Spotlight/VS Code) triggered via `⌘K` / `Ctrl+K` or clicking the search button. Live results as user types.

### Behavior
- Opens via keyboard shortcut or clicking `SearchButton`
- Uses `shadcn/ui Command` component
- Debounced input (300ms) triggers server action to search Supabase
- Shows up to 5 products + 3 matching categories
- Recent searches stored in localStorage (last 5)
- Keyboard navigation: ↑↓ to move, Enter to select, Esc to close

### Result Items
- **Products:** Thumbnail, name, price → links to `/products/[slug]`
- **Categories:** Icon + name → links to `/categories/[slug]`
- **Recent searches:** Clock icon + query text → re-runs search

### Files
| Action | Path |
|--------|------|
| Create | `components/layout/search-dialog.tsx` |
| Create | `lib/actions/search.ts` |
| Modify | `components/layout/search-button.tsx` |
| Modify | `components/layout/header.tsx` |

---

## Feature 2: Categories Pages

### Categories Listing (`/categories`)

#### Layout
- Page header: "Shop by Category" title with fade-in animation
- Responsive grid: 1 col mobile, 2 col tablet, 3-4 col desktop
- Each card: full-bleed image, gradient overlay, category name, product count badge
- Hover: subtle scale + brightness shift (GSAP)

#### Data
- Fetch categories with product counts via server component
- Query: join `categories` with `products` count where `is_active = true`

#### Files
| Action | Path |
|--------|------|
| Modify | `app/(store)/categories/page.tsx` |
| Create | `components/categories/category-card.tsx` |
| Modify | `lib/supabase/queries.ts` |

### Category Detail (`/categories/[slug]`)

#### Layout
- Hero banner (category image as background, 40vh height)
- Overlay with category name + description
- Breadcrumb below hero
- Product grid with existing `ProductFilters` + `ProductGrid`
- Empty state if no products

#### Data
- Fetch category by slug
- Reuse `getProducts({ category: slug })` for products

#### Files
| Action | Path |
|--------|------|
| Create | `app/(store)/categories/[slug]/page.tsx` |
| Create | `components/categories/category-hero.tsx` |
| Create | `components/categories/index.ts` |

---

## Feature 3: Order Detail Page

### Overview
Full order information with status timeline, items, and reorder capability.

### Layout (top to bottom)

1. **Header row**
   - Back link to orders list
   - Order number + date
   - Status badge (colored based on status)

2. **Status timeline**
   - Horizontal stepper: Pending → Paid → Processing → Shipped → Delivered
   - Current step highlighted, past steps checked
   - Timestamps below each completed step (from `order_status_history` table)

3. **Two-column grid (desktop) / stacked (mobile)**

   **Left column:**
   - Items list (image, name, variant, qty × price)
   - Each item links to product page

   **Right column:**
   - Order summary card (subtotal, discount, shipping, wallet used, total)
   - Shipping address card
   - Tracking number with copy button (if shipped/delivered)

4. **Action buttons**
   - "Reorder" button - adds all items to cart
   - "Need Help?" link - goes to `/contact`

### Security
- Verify order belongs to logged-in user before displaying

### Files
| Action | Path |
|--------|------|
| Create | `app/(store)/account/orders/[id]/page.tsx` |
| Create | `components/account/order-timeline.tsx` |
| Create | `components/account/order-items.tsx` |
| Modify | `lib/supabase/queries.ts` |

---

## Summary

| Feature | New Files | Modified Files |
|---------|-----------|----------------|
| Search Dialog | 2 | 2 |
| Categories Pages | 4 | 2 |
| Order Detail | 3 | 1 |
| **Total** | **9** | **5** |

---

## Next Steps
1. Create implementation plan with task breakdown
2. Implement features in order: Search → Categories → Order Detail
3. Test each feature before moving to next
