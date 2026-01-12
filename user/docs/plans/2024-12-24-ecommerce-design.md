# E-commerce Platform Design Document

**Date:** 2024-12-24
**Status:** Approved for Implementation

---

## 1. Overview

A modern, minimal e-commerce platform for physical products with a high-end fashion aesthetic. Built with Next.js 16 and designed for a small catalog (<50 products) with variant support.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (Email + Social) |
| Storage | Supabase Storage (product images) |
| Payments | Razorpay |
| Email | Resend (transactional emails) |

### Design Aesthetic

- **Style:** Minimal, editorial, high-end Japanese-inspired
- **Colors:** Black/white dominant, minimal accents
- **Typography:** Clean sans-serif (Geist), bold headlines
- **Layout:** Generous whitespace, large imagery

**Design References:**
- Soilboy.sg - Editorial hero, minimal header
- Markaware.jp - Ultra-clean product pages
- D&K Luxur - Practical e-commerce elements

---

## 2. Pages & Routes

### Customer-Facing

```
/                           Home
/products                   Product listing (with filters)
/products/[slug]            Product detail
/categories/[slug]          Category page
/cart                       Shopping cart
/checkout                   Checkout flow
/account                    Account dashboard
/account/orders             Order history
/account/orders/[id]        Order detail & tracking
/account/addresses          Address book
/account/wallet             Wallet & transactions
/account/wishlist           Saved items
/account/notifications      Notification center
/blog                       Blog listing
/blog/[slug]                Blog post
/auth/login                 Login
/auth/signup                Sign up
/auth/forgot-password       Password reset
```

### Admin (via Supabase Dashboard)

Product management, order updates, discount codes, and blog posts will be managed directly through the Supabase dashboard. No custom admin UI in this version.

---

## 3. Database Schema

### Core Tables

```sql
-- Users (extends Supabase auth.users)
profiles
├── id (uuid, FK to auth.users)
├── full_name
├── phone
├── avatar_url
├── created_at
├── updated_at

-- Addresses
addresses
├── id (uuid)
├── user_id (FK)
├── label (Home/Work/Other)
├── full_name
├── phone
├── line1, line2
├── city, state, pincode
├── is_default (boolean)
├── created_at

-- Categories
categories
├── id (uuid)
├── name
├── slug (unique)
├── description
├── image_url
├── parent_id (FK, nullable for subcategories)
├── position (for ordering)
├── is_active

-- Products
products
├── id (uuid)
├── name
├── slug (unique)
├── description (rich text)
├── category_id (FK)
├── images (text[], array of URLs)
├── has_variants (boolean)
├── base_price (for display when no variant selected)
├── is_active
├── created_at
├── updated_at

-- Product Options (defines variant types)
product_options
├── id (uuid)
├── product_id (FK)
├── name (e.g., "Color", "Size")
├── values (text[], e.g., ["Red", "Blue", "Green"])
├── position (for ordering)

-- Product Variants
product_variants
├── id (uuid)
├── product_id (FK)
├── name (e.g., "Red / Large")
├── sku (unique)
├── price
├── compare_at_price (for showing discounts)
├── stock_quantity
├── options (jsonb, e.g., {"color": "Red", "size": "Large"})
├── image_url (variant-specific image, nullable)
├── is_active

-- Product Details (for tabs: Details, Fabric, Care)
product_details
├── id (uuid)
├── product_id (FK)
├── tab_name (e.g., "Details", "Fabric", "Care Guide")
├── content (rich text)
├── position
```

### Cart & Orders

```sql
-- Cart Items
cart_items
├── id (uuid)
├── user_id (FK)
├── product_id (FK)
├── variant_id (FK, nullable)
├── quantity
├── created_at
├── updated_at

-- Orders
orders
├── id (uuid)
├── order_number (unique, e.g., "ORD-2024-0001")
├── user_id (FK)
├── status (pending, paid, processing, shipped, delivered, cancelled, refunded)
├── subtotal
├── discount_amount
├── shipping_cost
├── total
├── shipping_address (jsonb, snapshot)
├── discount_code_id (FK, nullable)
├── razorpay_order_id
├── razorpay_payment_id
├── wallet_amount_used
├── notes
├── created_at
├── updated_at

-- Order Items
order_items
├── id (uuid)
├── order_id (FK)
├── product_id (FK)
├── variant_id (FK, nullable)
├── product_name (snapshot)
├── variant_name (snapshot)
├── quantity
├── price_at_purchase
├── image_url (snapshot)

-- Order Status History
order_status_history
├── id (uuid)
├── order_id (FK)
├── status
├── note
├── created_at
├── created_by (FK to profiles, nullable for system)
```

### Features Tables

```sql
-- Wishlists
wishlists
├── id (uuid)
├── user_id (FK)
├── product_id (FK)
├── created_at
├── UNIQUE(user_id, product_id)

-- Reviews
reviews
├── id (uuid)
├── user_id (FK)
├── product_id (FK)
├── rating (1-5)
├── title
├── content
├── is_verified_purchase
├── is_approved
├── created_at
├── UNIQUE(user_id, product_id)

-- Discount Codes
discount_codes
├── id (uuid)
├── code (unique)
├── type (percentage, fixed_amount)
├── value
├── min_order_amount
├── max_discount_amount (for percentage)
├── max_uses
├── current_uses
├── valid_from
├── valid_until
├── is_active

-- Bulk Discounts (Buy 2 get 10% off)
bulk_discounts
├── id (uuid)
├── min_quantity
├── discount_percentage
├── is_active

-- Wallets
wallets
├── id (uuid)
├── user_id (FK, unique)
├── balance
├── updated_at

-- Wallet Transactions
wallet_transactions
├── id (uuid)
├── wallet_id (FK)
├── type (credit, debit)
├── amount
├── description
├── reference_type (razorpay, order, refund)
├── reference_id
├── created_at

-- Recently Viewed
recently_viewed
├── id (uuid)
├── user_id (FK)
├── product_id (FK)
├── viewed_at
├── UNIQUE(user_id, product_id)

-- Related Products (manual curation)
related_products
├── product_id (FK)
├── related_product_id (FK)
├── PRIMARY KEY(product_id, related_product_id)

-- Notifications
notifications
├── id (uuid)
├── user_id (FK)
├── type (order_update, back_in_stock, promo, price_drop)
├── title
├── message
├── link
├── is_read
├── created_at

-- Newsletter Subscribers
newsletter_subscribers
├── id (uuid)
├── email (unique)
├── is_active
├── subscribed_at
├── unsubscribed_at

-- Blog Posts
blog_posts
├── id (uuid)
├── title
├── slug (unique)
├── excerpt
├── content (rich text)
├── featured_image
├── author_id (FK)
├── is_published
├── published_at
├── created_at
├── updated_at

-- Instagram Posts (cached)
instagram_posts
├── id (uuid)
├── instagram_id (unique)
├── media_url
├── permalink
├── caption
├── media_type (image, video, carousel)
├── timestamp
├── cached_at
```

### Store Settings

```sql
-- Store Settings (managed via Supabase)
store_settings
├── id (single row)
├── flat_shipping_rate
├── free_shipping_threshold
├── instagram_username
├── loyalty_points_per_rupee (e.g., 1 point per ₹100)
├── updated_at
```

---

## 4. UI Components

### Layout

```
components/
├── layout/
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation (with mega menu)
│   │   ├── SearchBar
│   │   ├── AccountIcon
│   │   └── CartIcon (with count badge)
│   ├── PromoBanner (top banner with discount code)
│   ├── Footer
│   │   ├── NewsletterSignup
│   │   ├── FooterLinks (multi-column)
│   │   ├── SocialIcons
│   │   └── PaymentIcons
│   └── MobileNav (slide-out)
```

### Product Components

```
├── products/
│   ├── ProductCard
│   │   ├── Image (with hover effect)
│   │   ├── Name, Price
│   │   ├── DiscountBadge
│   │   └── WishlistButton
│   ├── ProductGrid
│   ├── ProductFilters (category, price, size)
│   ├── ProductGallery (large image + thumbnails)
│   ├── VariantSelector
│   │   ├── ColorSwatches (circles)
│   │   └── SizeButtons (bordered)
│   ├── SizeChart (modal)
│   ├── AddToCartButton
│   ├── BuyNowButton
│   ├── ProductTabs (Details, Fabric, Care)
│   ├── BulkDiscountBanner
│   ├── ReviewList
│   ├── ReviewForm
│   ├── StarRating
│   └── RelatedProducts
```

### Cart & Checkout

```
├── cart/
│   ├── CartDrawer (slide-out sheet)
│   ├── CartItem (image, name, variant, qty, price)
│   ├── QuantitySelector
│   └── CartSummary
├── checkout/
│   ├── AddressSelector
│   ├── AddressForm
│   ├── DiscountCodeInput
│   ├── WalletPaymentToggle
│   ├── OrderSummary
│   └── RazorpayButton
```

### Account

```
├── account/
│   ├── AccountSidebar
│   ├── OrderList
│   ├── OrderDetail
│   ├── OrderTracking (status timeline)
│   ├── AddressBook
│   ├── WalletCard (balance + add money)
│   ├── TransactionHistory
│   ├── WishlistGrid
│   └── NotificationList
```

### Other

```
├── blog/
│   ├── BlogCard
│   ├── BlogGrid
│   └── BlogContent
├── home/
│   ├── HeroSection (editorial, large image)
│   ├── FeaturedProducts
│   ├── CategoryGrid
│   ├── InstagramFeed
│   └── StatsSection (optional)
└── shared/
    ├── SearchAutocomplete
    ├── Breadcrumb
    ├── EmptyState
    ├── LoadingSpinner
    └── Toast
```

---

## 5. Key User Flows

### Purchase Flow

1. Browse products → Filter/Search
2. View product → Select variant (color/size)
3. Add to cart → Cart drawer opens
4. Review cart → Apply discount code
5. Checkout → Select/add address
6. Choose payment: Wallet + Razorpay
7. Complete payment
8. Order confirmation page + email
9. Track order in account

### Wallet Flow

1. Go to Account → Wallet
2. Click "Add Money"
3. Enter amount → Pay via Razorpay
4. Balance credited
5. At checkout, toggle "Use Wallet Balance"
6. If partial, pay remaining via Razorpay

### Review Flow

1. Purchase product → Order delivered
2. Go to product page OR account orders
3. Click "Write Review"
4. Rate (1-5 stars) + title + content
5. Submit → Pending approval
6. Admin approves → Review visible

---

## 6. Design Specifications

### Colors

```css
--background: white
--foreground: black
--muted: #f4f4f5 (zinc-100)
--muted-foreground: #71717a (zinc-500)
--accent: customizable per brand
--destructive: #ef4444 (red)
--success: #22c55e (green)
```

### Typography

```css
--font-sans: Geist Sans
--font-mono: Geist Mono

/* Headings */
h1: 2.25rem (36px), font-semibold, tracking-tight
h2: 1.875rem (30px), font-semibold
h3: 1.5rem (24px), font-medium

/* Body */
body: 1rem (16px), leading-relaxed
small: 0.875rem (14px)
```

### Spacing

- Container max-width: 1280px
- Section padding: 64px (desktop), 32px (mobile)
- Component gaps: 16px, 24px, 32px

### Components (shadcn/ui New York)

- Buttons: Rounded corners, medium padding
- Inputs: Clean borders, subtle focus states
- Cards: Minimal shadow or border
- Sheets: Slide-out cart drawer
- Dialogs: Clean modals
- Tabs: Underline style

---

## 7. Technical Notes

### Performance
- Image optimization via next/image
- Server Components for product pages
- Client Components for interactive elements
- Suspense boundaries for loading states

### SEO
- Dynamic meta tags per product/blog
- Structured data (JSON-LD) for products
- Sitemap generation
- OpenGraph images

### Security
- Supabase RLS policies
- Server-side validation
- Razorpay webhook verification
- Rate limiting on API routes

### Notifications
- Email via Resend for:
  - Order confirmation
  - Order status updates
  - Password reset
  - Newsletter
- In-app notifications stored in DB

---

## 8. Implementation Priority

### Phase 1: Core Store
1. Project setup (Supabase, shadcn/ui)
2. Layout (header, footer, mobile nav)
3. Product listing & detail pages
4. Cart functionality
5. Checkout with Razorpay
6. User auth & account basics

### Phase 2: Enhanced Features
7. Variants system
8. Wishlist
9. Reviews & ratings
10. Search with autocomplete
11. Discount codes

### Phase 3: Engagement & Polish
12. Wallet system
13. Notifications
14. Order tracking
15. Newsletter & blog
16. Instagram feed
17. Performance optimization

---

## 9. File Structure

```
app/
├── (store)/
│   ├── page.tsx                    # Home
│   ├── products/
│   │   ├── page.tsx                # Product listing
│   │   └── [slug]/page.tsx         # Product detail
│   ├── categories/[slug]/page.tsx
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   └── layout.tsx                  # Store layout
├── (account)/
│   ├── account/
│   │   ├── page.tsx                # Dashboard
│   │   ├── orders/
│   │   ├── addresses/
│   │   ├── wallet/
│   │   ├── wishlist/
│   │   └── notifications/
│   └── layout.tsx                  # Account layout
├── (auth)/
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   └── layout.tsx
├── api/
│   ├── razorpay/
│   │   ├── create-order/route.ts
│   │   └── webhook/route.ts
│   ├── wallet/route.ts
│   └── newsletter/route.ts
├── layout.tsx                      # Root layout
└── globals.css

components/
├── ui/                             # shadcn/ui components
├── layout/
├── products/
├── cart/
├── checkout/
├── account/
├── blog/
├── home/
└── shared/

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── types.ts
├── razorpay.ts
├── utils.ts
└── constants.ts

hooks/
├── use-cart.ts
├── use-wishlist.ts
├── use-auth.ts
└── use-notifications.ts

types/
└── index.ts
```

---

**End of Design Document**
