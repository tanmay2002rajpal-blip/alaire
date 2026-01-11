# Admin Dashboard - Testing Error Report

**Date:** January 11, 2026
**Tested By:** Automated Playwright Testing
**Environment:** Next.js 16.1.1 (Turbopack), localhost:3000

---

## Summary

| Severity | Count |
|----------|-------|
| Critical (App Breaking) | 3 |
| Medium (Functional Issues) | 3 |
| Low (Non-Critical) | 1 |
| **Total** | **7** |

---

## Critical Errors

### 1. Add Product Page Crashes

- **Page:** `/products/new`
- **Error:** `A <Select.Item /> must have a value prop that is not an empty string`
- **Location:** `components/ui/select.tsx:109` called from `app/(dashboard)/products/[id]/product-editor-client.tsx:416`
- **Impact:** Cannot add new products - page crashes immediately on load
- **Reproduction:**
  1. Navigate to Products page
  2. Click "Add Product" button
  3. Page crashes with Runtime Error

**Stack Trace:**
```
SelectItem @ components/ui/select.tsx (109:5)
ProductEditorClient @ app/(dashboard)/products/[id]/product-editor-client.tsx (416:23)
ProductPage @ app/(dashboard)/products/[id]/page.tsx (26:5)
```

---

### 2. Edit Product Route Missing (404)

- **Page:** `/products/[id]/edit`
- **Error:** 404 Not Found
- **Impact:** Cannot edit any existing products
- **Reproduction:**
  1. Navigate to Products page
  2. Click on any product name OR click "Edit" from action menu
  3. Returns 404 page

**Expected:** Route should exist at `app/(dashboard)/products/[id]/edit/page.tsx`

**Affected URLs:**
- `/products/b1111111-1111-1111-1111-111111111111/edit`
- `/products/b2222222-2222-2222-2222-222222222222/edit`
- (all product edit URLs)

---

### 3. Add Category Dialog Crashes

- **Page:** `/categories` (Add Category dialog)
- **Error:** `A <Select.Item /> must have a value prop that is not an empty string`
- **Location:** `components/ui/select.tsx:109` called from `app/(dashboard)/categories/categories-client.tsx:502`
- **Impact:** Cannot add new categories
- **Reproduction:**
  1. Navigate to Categories page
  2. Click "Add Category" button
  3. Dialog crashes with Runtime Error

**Stack Trace:**
```
SelectItem @ components/ui/select.tsx (109:5)
CategoriesClient @ app/(dashboard)/categories/categories-client.tsx (502:19)
CategoriesPage @ app/(dashboard)/categories/page.tsx (7:10)
```

---

## Medium Errors

### 4. Dashboard - Incorrect "Pending Orders" Link

- **Page:** `/dashboard`
- **Element:** "Pending Orders" card
- **Current URL:** `/admin/orders?status=pending`
- **Expected URL:** `/orders?status=pending`
- **Impact:** Clicking the card leads to 404

**Location to fix:** `app/(dashboard)/dashboard/page.tsx`

---

### 5. Dashboard - Incorrect "Low Stock Items" Link

- **Page:** `/dashboard`
- **Element:** "Low Stock Items" card
- **Current URL:** `/admin/inventory?filter=low-stock`
- **Expected URL:** `/inventory?filter=low-stock`
- **Impact:** Clicking the card leads to 404

**Location to fix:** `app/(dashboard)/dashboard/page.tsx`

---

### 6. Products Page - Hydration Mismatch

- **Page:** `/products`
- **Error:** `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties`
- **Impact:** Console warning, potential UI inconsistencies
- **Notes:** This is a React hydration error indicating server/client HTML mismatch

---

## Low Errors

### 7. Product Images - 404 for Unsplash Images

- **Pages:** `/products`, `/inventory`
- **Error:** `Failed to load resource: the server responded with a status of 404 (Not Found)`
- **URL Pattern:** `/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2F...`
- **Impact:** Product images don't load (shows broken image or placeholder)
- **Root Cause:** `images.unsplash.com` domain likely not configured in `next.config.ts` for Next.js Image optimization

**Fix:** Add to `next.config.ts`:
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
  ],
}
```

---

## Pages Tested - Status

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Login | `/login` | ✅ Working | |
| Dashboard | `/dashboard` | ⚠️ Partial | Incorrect link URLs |
| Products List | `/products` | ⚠️ Partial | Hydration error, image 404s |
| Add Product | `/products/new` | ❌ Broken | Crashes on load |
| Edit Product | `/products/[id]/edit` | ❌ Broken | 404 - Route missing |
| Categories List | `/categories` | ✅ Working | |
| Add Category | `/categories` (dialog) | ❌ Broken | Crashes on open |
| Orders | `/orders` | ✅ Working | |
| Customers | `/customers` | ✅ Working | |
| Inventory | `/inventory` | ✅ Working | |
| Coupons | `/coupons` | ✅ Working | |
| Newsletter | `/newsletter` | ✅ Working | |
| Hero Slides | `/content/hero` | ✅ Working | |
| Blog Posts | `/content/blog` | ✅ Working | |
| Promotions | `/content/promotions` | ✅ Working | |
| Sales Reports | `/analytics/sales` | ✅ Working | |
| Customer Insights | `/analytics/customers` | ✅ Working | |
| Team | `/team` | ✅ Working | |
| Settings | `/settings` | ✅ Working | |

---

## Root Cause Analysis

### SelectItem Empty Value Error

This is a **systemic issue** affecting multiple components. The Radix UI Select component does not allow `<Select.Item>` to have an empty string value (`value=""`). This is because empty string is reserved for clearing the selection.

**Affected Files:**
1. `app/(dashboard)/products/[id]/product-editor-client.tsx` - Line 416
2. `app/(dashboard)/categories/categories-client.tsx` - Line 502

**Common Causes:**
- Dropdown options generated from data that includes empty/null values
- Placeholder options with `value=""`
- Category/type selectors where "All" or "None" option has empty value

**Fix Pattern:**
```tsx
// Instead of:
<SelectItem value="">All Categories</SelectItem>

// Use:
<SelectItem value="all">All Categories</SelectItem>
// Or filter out empty values before rendering
```

---

## Recommended Fix Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| P0 | Fix SelectItem errors (products & categories) | Medium |
| P0 | Create edit product route | Medium |
| P1 | Fix dashboard link URLs | Low |
| P2 | Configure Unsplash images in next.config.ts | Low |
| P2 | Investigate hydration mismatch | Medium |

---

## Additional Notes

- Testing was performed with admin user: `admin@alaire.in`
- All API endpoints appear to be working correctly
- Database connectivity is functional
- Authentication flow works properly
