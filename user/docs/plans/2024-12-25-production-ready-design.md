# Production-Ready Alaire Design

**Date**: December 25, 2024
**Status**: Approved

---

## Overview

Make Alaire e-commerce store production-ready with promotional banner, Google OAuth authentication, Shiprocket delivery integration, Instagram feed, and essential pages.

---

## 1. Promotional Banner

**Component**: `components/layout/promo-banner.tsx`
**Location**: Fixed at the very top, above header

### Design
```
┌─────────────────────────────────────────────────┐
│  ✦  Free shipping on orders over ₹999  ✦    ✕  │
└─────────────────────────────────────────────────┘
```

### Behavior
- Slim black strip (~36px height) with white text
- Auto-rotates through 3 messages every 4 seconds with fade transition
- Dismissible with × button (stores preference in localStorage)
- Mobile: Same behavior, slightly smaller text

### Messages
1. "Free shipping on orders over ₹999"
2. "Use code WELCOME20 for 20% off"
3. "New arrivals every week"

### Tech
- Client component with `useState` for rotation
- `useEffect` with interval for auto-rotation
- GSAP for smooth fade transitions
- localStorage for dismiss state

---

## 2. Auth Dialog (Google Only)

**Components**:
- `components/auth/auth-dialog.tsx`
- `components/auth/auth-provider.tsx`

### Design
```
┌──────────────────────────────────────────────────────┐
│                  (translucent backdrop)              │
│                                                      │
│          ┌─────────────────────────────┐             │
│          │         ALAIRE              │             │
│          │                             │             │
│          │   Sign in to continue       │             │
│          │                             │             │
│          │   ┌─────────────────────┐   │             │
│          │   │ G  Continue with Google │             │
│          │   └─────────────────────┘   │             │
│          │                             │             │
│          │   By continuing, you agree  │             │
│          │   to our Terms & Privacy    │             │
│          └─────────────────────────────┘             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Behavior
- **Triggers**:
  - Click on User icon in header
  - Protected actions: add to cart, add to wishlist, checkout (when not logged in)
- Backdrop: `bg-black/50 backdrop-blur-sm` (translucent, content visible behind)
- Dialog: Clean white card, centered, subtle shadow
- Close with × button or clicking outside
- On success: Dialog closes, UI updates to logged-in state

### Tech
- shadcn `Dialog` component
- Google OAuth via Supabase `signInWithOAuth`
- `AuthProvider` context for global auth state and dialog control

### Removals
- Delete existing email/password auth pages:
  - `app/(auth)/auth/login`
  - `app/(auth)/auth/signup`
  - `app/(auth)/auth/forgot-password`
  - `app/(auth)/auth/reset-password`

---

## 3. Shiprocket Integration

### A. Pincode Serviceability (Checkout)

**Component**: `components/checkout/pincode-checker.tsx`
**Location**: Checkout page, shipping address section

#### Design
```
┌─────────────────────────────────────────┐
│  Shipping Address                       │
│                                         │
│  Pincode: [560001] [Check]              │
│                                         │
│  ✓ Delivery available                   │
│    Estimated: 3-5 business days         │
│    Shipping: ₹49                        │
│                                         │
│  City: Bangalore    (auto-filled)       │
│  State: Karnataka   (auto-filled)       │
│                                         │
│  Address Line 1: [________________]     │
│  Address Line 2: [________________]     │
└─────────────────────────────────────────┘
```

#### Behavior
- User enters pincode → auto-checks on 6 digits or manual Check button
- Shiprocket API returns: serviceability, delivery estimate, shipping cost
- City/State auto-populated from pincode
- If not serviceable: "Sorry, delivery not available to this pincode"

### B. Order Tracking (Account)

**Component**: `components/account/order-tracking.tsx`
**Route**: `/account/orders/[id]`

#### Design
```
┌─────────────────────────────────────────┐
│  Order #ALR-2024-1234                   │
│                                         │
│  ● Delivered                            │
│  │                                      │
│  ○ Out for Delivery - Dec 24, 2:30 PM   │
│  │                                      │
│  ○ In Transit - Dec 23, 10:00 AM        │
│  │                                      │
│  ○ Shipped - Dec 22, 4:00 PM            │
│  │                                      │
│  ○ Order Placed - Dec 21, 8:00 PM       │
│                                         │
│  Tracking #: SR1234567890               │
│  Courier: Delhivery                     │
└─────────────────────────────────────────┘
```

### Shiprocket APIs
- `POST /external/auth/login` - Get token
- `GET /courier/serviceability` - Check pincode
- `POST /orders/create/adhoc` - Create shipment
- `GET /courier/track/awb/{awb}` - Track order

### Database Changes
Add to `orders` table:
- `shiprocket_order_id` (text)
- `awb_number` (text)
- `courier_name` (text)

---

## 4. Instagram Feed

**Component**: `components/home/instagram-feed.tsx`
**Location**: Homepage, above footer

### Design
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│            Follow us @alaire.official               │
│                                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │     │ │     │ │ ▶   │ │     │ │     │ │ ▶   │   │
│  │ IMG │ │ IMG │ │REEL │ │ IMG │ │ IMG │ │REEL │   │
│  │     │ │     │ │     │ │     │ │     │ │     │   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │
│                                                     │
│              [Follow on Instagram]                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Behavior
- Displays latest 6-8 posts/reels
- Hover: Subtle scale + overlay with likes/comments count
- Click: Opens Instagram post in new tab
- Reels show play icon overlay
- Responsive: 6 on desktop, 4 on tablet, 2 on mobile (scrollable)

### Tech
- Instagram Basic Display API (free tier)
- Server-side fetch with caching (revalidate every hour)
- Fallback: Static placeholder if API fails

---

## 5. Legal Pages

**Routes**: `/terms`, `/privacy`, `/returns`

### Design
```
┌─────────────────────────────────────────┐
│  [Header]                               │
├─────────────────────────────────────────┤
│                                         │
│  Terms of Service                       │
│  ─────────────────                      │
│  Last updated: December 2024            │
│                                         │
│  1. Introduction                        │
│     [Content...]                        │
│                                         │
│  2. Use of Service                      │
│     [Content...]                        │
│                                         │
├─────────────────────────────────────────┤
│  [Footer]                               │
└─────────────────────────────────────────┘
```

### Pages
1. **Terms of Service** (`/terms`) - Usage terms, liability, disputes
2. **Privacy Policy** (`/privacy`) - Data collection, cookies, third parties
3. **Return Policy** (`/returns`) - Return window, conditions, refund process

### Notes
- Placeholder content provided (owner fills in actual legal text)
- Linked from footer
- Linked from auth dialog ("By continuing, you agree to our Terms & Privacy")

---

## 6. Error Pages

### 404 Page (`app/not-found.tsx`)
```
┌─────────────────────────────────────────┐
│                                         │
│              ALAIRE                     │
│                                         │
│         Page not found                  │
│                                         │
│   The page you're looking for           │
│   doesn't exist or has been moved.      │
│                                         │
│        [Continue Shopping]              │
│                                         │
└─────────────────────────────────────────┘
```

### Error Page (`app/error.tsx`)
```
┌─────────────────────────────────────────┐
│                                         │
│              ALAIRE                     │
│                                         │
│       Something went wrong              │
│                                         │
│   We're having trouble loading          │
│   this page. Please try again.          │
│                                         │
│     [Try Again]  [Go Home]              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 7. Loading States

**Component**: Extend `components/ui/skeleton.tsx`

### Skeleton Variants

#### Product Card
```
┌──────────────┐
│ ░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░ │
│              │
│ ░░░░░░░░     │
│ ░░░░         │
└──────────────┘
```

#### Product Grid
```
┌────┐ ┌────┐ ┌────┐ ┌────┐
│░░░░│ │░░░░│ │░░░░│ │░░░░│
│░░░░│ │░░░░│ │░░░░│ │░░░░│
└────┘ └────┘ └────┘ └────┘
```

### Applied To
- Product grids (`/products`, `/categories/*`)
- Product detail page
- Cart page
- Account sections
- Order history

### Style
- Subtle shimmer animation
- Matches luxury aesthetic (not jarring)

---

## Implementation Checklist

### New Components
| Component | Path |
|-----------|------|
| PromoBanner | `components/layout/promo-banner.tsx` |
| AuthDialog | `components/auth/auth-dialog.tsx` |
| AuthProvider | `components/auth/auth-provider.tsx` |
| PincodeChecker | `components/checkout/pincode-checker.tsx` |
| OrderTracking | `components/account/order-tracking.tsx` |
| InstagramFeed | `components/home/instagram-feed.tsx` |
| Skeleton variants | `components/ui/skeleton.tsx` |

### New Pages
| Page | Path |
|------|------|
| Terms of Service | `app/(store)/terms/page.tsx` |
| Privacy Policy | `app/(store)/privacy/page.tsx` |
| Return Policy | `app/(store)/returns/page.tsx` |
| 404 | `app/not-found.tsx` |
| Error | `app/error.tsx` |
| Order Detail | `app/(store)/account/orders/[id]/page.tsx` |

### Server Actions
| Action | Path |
|--------|------|
| signInWithGoogle | `lib/supabase/auth.ts` |
| checkServiceability | `lib/shiprocket/actions.ts` |
| getShippingRates | `lib/shiprocket/actions.ts` |
| trackOrder | `lib/shiprocket/actions.ts` |

### Database Migrations
```sql
ALTER TABLE orders
ADD COLUMN shiprocket_order_id TEXT,
ADD COLUMN awb_number TEXT,
ADD COLUMN courier_name TEXT;
```

---

## External Setup Required

### 1. Google Cloud Console
1. Create new project or use existing
2. Enable Google+ API
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `https://[your-supabase-ref].supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

### 2. Supabase Dashboard
1. Go to Authentication > Providers
2. Enable Google
3. Paste Client ID and Client Secret from Google Cloud
4. Save

### 3. Shiprocket Dashboard
1. Sign up at shiprocket.in
2. Go to Settings > API
3. Generate API credentials
4. Add to `.env.local`:
   ```
   SHIPROCKET_EMAIL=your-email
   SHIPROCKET_PASSWORD=your-password
   ```

### 4. Instagram Basic Display API
1. Create Facebook Developer account
2. Create new app > Consumer
3. Add Instagram Basic Display product
4. Add Instagram test user
5. Generate access token
6. Add to `.env.local`:
   ```
   INSTAGRAM_ACCESS_TOKEN=your-token
   INSTAGRAM_USER_ID=your-user-id
   ```

---

## Environment Variables

Add to `.env.local`:
```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=...

# New - Shiprocket
SHIPROCKET_EMAIL=your-email
SHIPROCKET_PASSWORD=your-password

# New - Instagram
INSTAGRAM_ACCESS_TOKEN=your-token
INSTAGRAM_USER_ID=your-user-id
```

---

## Notes

- **Google OAuth only** - No email/password authentication
- **Shiprocket handles all delivery** - No separate maps API needed
- **Legal pages** - Placeholder content, owner fills actual text
- **Instagram** - Requires business/creator account for API access
