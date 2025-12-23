# Alaire E-Commerce Store Design

## Overview

E-commerce store for physical products (socks and underwear initially), designed to scale. Features user accounts, variant support, wishlist, and Razorpay payments.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York theme)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Razorpay
- **State:** React Context for cart (persisted to localStorage)

## Design References

- **Product Details:** [MARKAWARE](https://markaware.jp/en/products/heavy-organic-wool-tropical-square-jacket-charcoal) - minimalist two-column layout, generous whitespace, size buttons, full-width CTA
- **Homepage/Listing:** [Shop.co](https://next-ecommerce-shopco.vercel.app/) - bold hero, product carousels, hover zoom, light gray cards, Framer Motion animations

## Project Structure

```
user/
├── app/
│   ├── (shop)/                    # Public store pages
│   │   ├── page.tsx               # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx           # Product listing
│   │   │   └── [slug]/page.tsx    # Product detail
│   │   ├── cart/page.tsx          # Shopping cart
│   │   └── checkout/
│   │       ├── page.tsx           # Checkout flow
│   │       └── success/page.tsx   # Order confirmation
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── account/
│   │   ├── page.tsx               # Profile
│   │   ├── orders/page.tsx
│   │   ├── addresses/page.tsx
│   │   └── wishlist/page.tsx
│   └── api/
│       ├── razorpay/
│       │   ├── create-order/route.ts
│       │   └── verify/route.ts
│       └── webhooks/
│           └── razorpay/route.ts
├── components/
│   ├── ui/                        # shadcn components
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── mobile-nav.tsx
│   │   └── nav-dropdown.tsx
│   ├── product/
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── image-gallery.tsx
│   │   ├── variant-selector.tsx
│   │   └── product-info.tsx
│   ├── cart/
│   │   ├── cart-item.tsx
│   │   ├── cart-summary.tsx
│   │   └── cart-drawer.tsx
│   ├── checkout/
│   │   ├── address-step.tsx
│   │   ├── review-step.tsx
│   │   └── step-indicator.tsx
│   └── account/
│       ├── address-card.tsx
│       ├── order-card.tsx
│       └── profile-form.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── razorpay/
│   │   └── client.ts
│   └── utils.ts
├── contexts/
│   ├── cart-context.tsx
│   └── auth-context.tsx
├── types/
│   └── index.ts
└── data/
    └── seed.ts                    # Test data
```

## Page Designs

### Homepage

- **Navigation:** Sticky header with logo, category dropdowns (Socks, Underwear), search icon, account icon, cart icon with badge
- **Mobile Nav:** Hamburger menu triggering side sheet with accordion navigation
- **Hero Section:** Bold headline, subtext, "Shop Now" CTA button, brand stats (products count, happy customers)
- **New Arrivals:** Product carousel with hover zoom effect
- **Category Cards:** Large clickable cards for Socks and Underwear
- **Newsletter:** Email signup section
- **Footer:** Navigation links, social icons, payment method icons

### Product Listing

- **Filter Sidebar:** Category, size, color, price range filters
- **Sort Dropdown:** Newest, Price (Low to High), Price (High to Low), Popular
- **Product Grid:** 3-4 columns on desktop, 2 on mobile
- **Product Cards:** Light gray background (#F0EEED), image with hover zoom (scale-110), product name, star rating, price, discount badge (red)

### Product Details (MARKAWARE Style)

- **Layout:** Two-column - image gallery (60%) left, product info (40%) right
- **Image Gallery:** Large main image, thumbnail strip below, carousel navigation
- **Product Info:**
  - Product name (large, bold)
  - Price (strikethrough original if discounted)
  - Stock indicator ("Only X Remaining")
  - Size selector (buttons, disabled when out of stock)
  - Color swatches (if multiple)
  - Quantity selector
  - Full-width "Add to Cart" button (black)
  - Heart icon for wishlist toggle
- **Collapsible Sections:** Description, Size Guide, Care Instructions

### Cart Page

- **Cart Items:** Product image, name, variant details, quantity +/- controls, unit price, remove button
- **Order Summary:** Subtotal, shipping (flat rate), total
- **Actions:** "Proceed to Checkout" CTA, "Continue Shopping" link
- **Empty State:** Illustration, "Your cart is empty" message, "Browse Products" CTA

### Checkout Flow (Multi-Step)

1. **Address Step:** Select from saved addresses or add new address form
2. **Review Step:** Order items summary, coupon code input, order total
3. **Payment Step:** Razorpay modal (cards, UPI, wallets, netbanking)
4. **Success Page:** Order confirmation, order ID, estimated delivery, "View Order" and "Continue Shopping" buttons

### Account Pages

- **Profile:** Edit name, email, phone number
- **Addresses:** List of saved addresses, add/edit/delete, set default
- **Orders:** Order history with status badges (Processing, Shipped, Delivered), expandable details
- **Wishlist:** Grid of saved products, quick "Add to Cart" button

### Auth Pages

- **Login:** Email, password, "Forgot password?" link, "Create account" link
- **Signup:** Name, email, password, confirm password
- **Forgot Password:** Email input, sends magic link

## Components (shadcn/ui)

Using these shadcn/ui components (New York theme):

- `Button` - CTAs, form submissions
- `Input`, `Label` - form fields
- `Card` - product cards, summary cards
- `Sheet` - mobile nav, cart drawer
- `Dialog` - confirmations, modals
- `DropdownMenu` - navigation dropdowns, sort options
- `Select` - form selects
- `Accordion` - collapsible product sections
- `Badge` - discount tags, order status
- `Skeleton` - loading states
- `Toast` - notifications ("Added to cart", errors)
- `Separator` - visual dividers
- `Avatar` - user profile

## Custom Components

| Component | Description |
|-----------|-------------|
| `ProductCard` | Image with hover zoom, rating stars, price display, discount badge |
| `ImageGallery` | Main image + thumbnail carousel, swipe support on mobile |
| `VariantSelector` | Size/color buttons with stock-aware disabled states |
| `CartItem` | Product row with quantity controls, stock limit enforcement |
| `AddressCard` | Saved address display with edit/delete actions |
| `OrderCard` | Order summary with status badge, expandable line items |
| `StepIndicator` | Checkout progress indicator |

## Key Interactions

- **Add to Cart:** Toast notification, cart icon badge count updates, optional cart drawer opens
- **Wishlist Toggle:** Heart icon fills/unfills with subtle animation
- **Image Gallery:** Click thumbnails to switch, swipe gestures on mobile
- **Quantity Controls:** +/- buttons respecting stock limits
- **Checkout Steps:** Visual step indicator, validation between steps, back navigation
- **Product Hover:** Image zoom (scale-110) with smooth transition

## Color Palette

- **Background:** White (#FFFFFF)
- **Card Background:** Light gray (#F0EEED)
- **Text Primary:** Black (#000000)
- **Text Secondary:** Gray (#6B7280)
- **CTA/Buttons:** Black (#000000)
- **Discount/Sale:** Red (#FF3333)
- **Success:** Green (#22C55E)
- **Border:** Light gray (#E5E5E5)

## Typography

Using Geist font family (already configured):
- **Headings:** Geist Sans, bold
- **Body:** Geist Sans, regular
- **Mono:** Geist Mono (prices, codes)

## Shipping

Starting with flat rate shipping:
- Standard rate for all orders
- Free shipping above threshold (configurable)
- Can upgrade to location-based or third-party integration later

## Test Data

Seed data includes:
- 6-8 products (mix of socks and underwear)
- Multiple variants per product (sizes: S, M, L, XL; colors: 2-3 per product)
- Sample images (placeholder or stock)
- Varying stock levels (including some out-of-stock variants)

## Future Considerations (Not in MVP)

- Admin dashboard
- Reviews and ratings system
- Related products recommendations
- Recently viewed products
- Inventory management
- Shiprocket/Delhivery integration
- Email notifications (order confirmation, shipping updates)
- Analytics integration
