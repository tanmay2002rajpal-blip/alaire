# Alaire Platform QA Todo (User + Admin)

_Last updated: 2026-03-03_

## Setup

- [x] Clone repo locally
- [x] Install dependencies for `user`
- [x] Install dependencies for `admin`
- [x] Configure `user/.env.local`
- [x] Configure `admin/.env.local`
- [x] Start user app (`http://localhost:3000`)
- [x] Start admin app (`http://localhost:3001`)
- [x] Run DB seed script (`admin/scripts/seed-mongodb.ts`)

---

## User Platform — Real User Journey Checklist

### Guest browsing
- [x] Open Home page (`/`)
- [x] Open Products listing (`/products`)
- [x] Open Categories listing (`/categories`)
- [x] Open Blog listing (`/blog`)
- [x] Open Cart (`/cart`)
- [x] Open Checkout (`/checkout`)
- [x] Open Contact (`/contact`)
- [x] Open FAQ (`/faq`)
- [x] Open Shipping (`/shipping`)
- [x] Open Returns (`/returns`)
- [x] Open Privacy (`/privacy`)
- [x] Open Terms (`/terms`)

### Account/auth routes (guest expectations)
- [x] Verify account routes are guarded (browser test redirects guest to `/`):
  - [x] `/account`
  - [x] `/account/settings`
  - [x] `/account/notifications`
  - [x] `/account/orders`
  - [x] `/account/wishlist`
  - [x] `/account/wallet`

### Dynamic pages (require valid IDs/slugs/session)
- [x] Product detail (`/products/[slug]`) — verified with existing + newly created admin product
- [ ] Category detail (`/categories/[slug]`) — pending targeted category click-through
- [x] Blog detail (`/blog/[slug]`) — verified with newly published admin post
- [x] Order confirmation (`/order-confirmation/[id]`) — verified via successful COD checkout
- [ ] Order detail (`/account/orders/[id]`) — pending authenticated account order history

---

## Admin Platform — Real Admin Journey Checklist

### Auth and access control
- [x] Open Login page (`/login`)
- [x] Verify admin routes are protected (redirect to `/login` when unauthenticated):
  - [x] `/`
  - [x] `/dashboard`
  - [x] `/products`
  - [x] `/orders`
  - [x] `/customers`
  - [x] `/inventory`
  - [x] `/categories`
  - [x] `/coupons`
  - [x] `/newsletter`
  - [x] `/settings`
  - [x] `/team`
  - [x] `/content`
  - [x] `/content/blog`
  - [x] `/content/blog/new`
  - [x] `/content/hero`
  - [x] `/content/promotions`
  - [x] `/analytics/sales`
  - [x] `/analytics/customers`

### Admin sign-in flow
- [x] Login as admin (`admin@alaire.in` / `admin123`) and reach dashboard (Playwright browser flow)

### Post-login functional checks
- [x] Dashboard page loads without runtime error
- [x] Products page loads without runtime error
- [x] Categories page loads without runtime error
- [x] Inventory page loads without runtime error
- [x] Orders page loads without runtime error
- [x] Customers page loads without runtime error
- [x] Coupons page loads without runtime error
- [x] Newsletter page loads without runtime error
- [x] Content pages load without runtime error (hero/promotions/blog/new)
- [x] Analytics pages load without runtime error
- [x] Settings page loads without runtime error
- [x] Team page loads without runtime error
- [ ] CRUD-level action tests (create/update/delete) across modules
- [ ] End-to-end order lifecycle status update verification

### CMS → Storefront visibility checks
- [x] Create product in admin CMS and verify it appears on user `/products`
- [x] Open new product detail on user storefront and verify content is visible
- [x] Create/publish blog post in admin CMS and verify it appears on user `/blog`

---

## Errors / Fixes Log

- [x] **Seed script initial failure** (`MONGODB_URI` not injected in shell run) — fixed by running seed with explicit env vars in command.
- [x] **Admin login verification** — confirmed successful via Playwright flow (`/login` -> `/dashboard`).
- [x] **Blog publish visibility hardening** — added dynamic rendering on user blog routes and additional blog revalidation hooks in admin actions; published admin posts now visible on user blog/detail.
- [x] **Checkout flow verified** — completed COD order from storefront and confirmed order creation in admin (Total Orders incremented 6 -> 7).

---

## Next actions (immediate)

1. Validate user authenticated account journey with real user login/session.
2. Execute CRUD-level admin tests (create/edit/delete entities) and verify persistence.
3. Complete category slug/detail deep checks.
4. Continue fix/retest loop until checklist is fully green.
