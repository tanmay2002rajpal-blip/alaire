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
- [ ] Product detail (`/products/[slug]`) — pending targeted product-by-product click-through
- [ ] Category detail (`/categories/[slug]`) — pending targeted category click-through
- [ ] Blog detail (`/blog/[slug]`) — pending targeted blog click-through
- [ ] Order confirmation (`/order-confirmation/[id]`) — pending order placement flow
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

---

## Errors / Fixes Log

- [x] **Seed script initial failure** (`MONGODB_URI` not injected in shell run) — fixed by running seed with explicit env vars in command.
- [x] **Admin login verification** — confirmed successful via Playwright flow (`/login` -> `/dashboard`).

---

## Next actions (immediate)

1. Run full user purchase flow: product detail -> cart -> checkout -> order confirmation.
2. Validate user authenticated account journey with real user login/session.
3. Execute CRUD-level admin tests (create/edit/delete entities) and verify persistence.
4. Fix issues found, retest, and update this checklist until fully green.
