# Alaire Admin Dashboard - Design Document

**Date:** 2025-12-25
**Status:** Approved
**Location:** E:/alaire/admin (separate Next.js app)

---

## Overview

A full-featured admin dashboard for the Alaire e-commerce store, designed for a small team (2-5 people) with role-based access (Admin/Staff). The dashboard provides comprehensive management of orders, products, customers, content, and analytics.

---

## Architecture

### Deployment Model

- **Separate admin app** at `E:/alaire/admin`
- Connects to same Supabase database as storefront
- Independent deployment (e.g., `admin.alaire.in`)
- Separate authentication system from customer accounts

### Database Additions

New tables for admin functionality:

| Table | Purpose |
|-------|---------|
| `admin_users` | Admin accounts with role (admin/staff) and permissions |
| `admin_sessions` | Track login sessions for security |
| `activity_log` | Audit trail of all admin actions |
| `notifications` | In-app notification queue per admin user |
| `coupons` | Discount codes with rules and usage tracking |
| `email_campaigns` | Newsletter campaigns and stats |
| `email_subscribers` | Newsletter subscriber list |

### Shared Tables

The admin reads/writes to existing storefront tables:
- `orders`, `order_items`, `order_status_history`
- `products`, `product_variants`, `categories`
- `users` (customers), `reviews`, `wishlists`, `wallet_transactions`
- `hero_slides`, `blog_posts`

---

## Navigation Structure

```
ALAIRE ADMIN

── Dashboard (overview)

OPERATIONS
── Orders
   ├── All Orders
   ├── Pending
   ├── Processing
   └── Returns/Refunds
── Products
   ├── All Products
   ├── Add New
   ├── Categories
   └── Inventory
── Customers
   ├── All Customers
   ├── Reviews
   └── Wishlists
── Coupons
   ├── All Coupons
   └── Create New

CONTENT
── Hero Slides
── Blog Posts
── Promotions
── Pages
── Newsletter
   ├── Subscribers
   ├── Campaigns
   └── Templates

ANALYTICS
── Sales Reports
── Inventory Reports
── Customer Insights

SETTINGS
── Team Members
── Store Settings
── Notifications
── Activity Log
```

### Role-Based Access

| Feature | Admin | Staff |
|---------|-------|-------|
| Orders, Products, Customers | Full | Full |
| Content, Coupons, Newsletter | Full | Full |
| Analytics | Full | Full |
| Team Members | Full | View only |
| Store Settings | Full | No access |
| Activity Log | Full | No access |

---

## Dashboard Overview

### Metric Cards (Top Row)

1. **Today's Revenue** - Amount with % change from yesterday
2. **Pending Orders** - Count needing attention (clickable)
3. **Low Stock Items** - Products below threshold (clickable)
4. **New Customers** - This week's signups

### Sales Chart

- Interactive area chart (existing component)
- Toggle: Today, 7 days, 30 days, 12 months
- Hover for exact figures

### Quick Actions

- Add Product
- View Pending Orders
- Update Hero Slide

### Recent Activity Feed

Live-updating list of last 10 events:
- Order placed, status changes
- Products added/updated
- Reviews submitted
- Team actions

### Alerts Section

- Low stock warnings
- Pending reviews to moderate
- Failed payments

---

## Orders Management

### List View

| Column | Details |
|--------|---------|
| Order ID | Clickable to detail |
| Customer | Name + email |
| Items | Count |
| Total | Amount in INR |
| Status | Badge with color |
| Date | Created timestamp |
| Actions | View, Quick status change |

**Bulk actions:** Mark shipped, Print invoices, Export CSV
**Filters:** Status, Date range, Payment method, Amount
**Search:** Order ID, customer name, email, phone

### Order Detail Page

**Left column (60%):**
- Customer info (name, email, phone, address)
- Order items with images, quantities, prices
- Order timeline with all status changes

**Right column (40%):**
- Status update dropdown with note field
- Payment details (Razorpay ID, method)
- Shiprocket panel:
  - Create Shipment button
  - Courier selection modal
  - AWB number display
  - Live tracking status
  - Print Label button
- Refund options:
  - Refund to original payment (Razorpay API)
  - Refund to wallet (adds to customer balance)

---

## Products & Inventory

### Products List

| Column | Details |
|--------|---------|
| Image | Thumbnail |
| Name | Product title |
| Category | Assigned category |
| Price | Display price |
| Stock | Total quantity |
| Status | Active/Draft badge |
| Actions | Edit, Delete |

**Bulk actions:** Activate, Deactivate, Delete, Update category
**Filters:** Category, Stock level, Status

### Product Editor

Tabbed interface:

1. **Basic Info** - Name, slug, description (rich text), category, tags
2. **Media** - Drag-drop images, reorder gallery, set featured
3. **Pricing** - Base price, compare-at price, cost price
4. **Variants** - Size/color matrix, per-variant stock and images
5. **Inventory** - Stock quantity, low threshold, tracking toggle
6. **SEO** - Meta title, description, OG image

### Inventory Management

Dedicated view with:
- Quick inline stock editing
- Bulk CSV import
- Low stock alerts (red highlight)
- Stock history modal

### Categories Manager

- Tree view with drag-drop reordering
- Create/edit: Name, slug, description, image
- Nested categories support

---

## Coupons

### Coupon List

| Column | Details |
|--------|---------|
| Code | Coupon code |
| Type | Percentage or Flat |
| Value | Discount amount |
| Min Order | Minimum order value |
| Usage | Used / Limit |
| Valid | Date range |
| Status | Active/Expired |

### Create Coupon Form

- Code (auto-generate or custom)
- Discount type: Percentage or Fixed
- Value (e.g., 10% or ₹200)
- Minimum order amount
- Usage limit (total and per-customer)
- Valid from/to dates
- Restrict to categories or products (optional)

### Usage Tracking

- View which orders used each coupon
- Revenue generated per coupon

---

## Content Management

### Hero Slides

- Drag-drop reordering
- Fields: Image, Title, Subtitle, Description, Button text/link, Alignment
- Schedule: Active from/to dates
- Status toggle

### Blog Posts

- Rich text editor (Tiptap)
- Fields: Title, Slug, Featured image, Content, Excerpt, Category, Tags
- SEO fields
- Publish or schedule

### Promotions

- Manage rotating promo banner messages
- Reorder, activate/deactivate
- Optional link per message

### Static Pages

- Edit Terms, Privacy, Returns
- Rich text editor
- Shows last updated on storefront

---

## Newsletter System

### Subscribers

| Column | Details |
|--------|---------|
| Email | Subscriber email |
| Name | If provided |
| Source | Checkout, footer, popup |
| Status | Active/Unsubscribed |
| Date | Subscribed date |

**Actions:** Export CSV, Add manually

### Email Campaigns

| Column | Details |
|--------|---------|
| Subject | Email subject |
| Status | Draft/Scheduled/Sent |
| Sent | Date sent |
| Opens | Open rate % |
| Clicks | Click rate % |

### Campaign Editor

- Subject line
- Rich text body with product card inserts
- Desktop/mobile preview
- Send test email
- Schedule or send immediately

### Blog-to-Newsletter

When publishing blog post:
- Option: "Send as newsletter?"
- Auto-generates email from content
- One-click send

### Email Templates

Pre-built templates:
- New product announcement
- Sale/promotion
- Blog digest

---

## Analytics & Reporting

### Sales Reports

- Revenue chart (line/area) with date range picker
- Total orders and average order value
- Top products by revenue and units
- Sales by category (pie chart)
- Payment method breakdown
- Coupon performance

### Inventory Reports

- Current inventory value
- Low stock alert list
- Stock movement (fast sellers)
- Dead stock (no sales in 30/60/90 days)

### Customer Insights

- New vs returning customers
- Top customers by spend
- Geographic distribution by state/city
- Customer lifetime value
- Most wishlisted products

### Scheduled Reports

- Daily summary (9 AM)
- Weekly digest (Monday)
- Configurable per admin user

---

## Team & Settings

### Team Members (Admin Only)

- Invite via email (48-hour expiry)
- Assign role: Admin or Staff
- Deactivate accounts
- Cannot delete self or last admin

### Activity Log (Admin Only)

- Searchable audit trail
- Filter by user, action type, date
- 90-day retention

### Store Settings

- General: Store name, contact info
- Shipping: Warehouse pincode, Shiprocket credentials
- Payments: Razorpay keys (masked)
- Notifications: Thresholds, digest preferences
- SEO: Default meta templates

### My Profile

- Update name, email, password
- Notification preferences
- Two-factor authentication

---

## Authentication

### Login Flow

- Email + password (no OAuth)
- Invite-only registration
- Password reset via Resend

### Session Management

- JWT in httpOnly cookies
- 24-hour expiry with refresh on activity
- Logout all devices option

### Security

- Rate limiting: 5 attempts, 15-min lockout
- All login attempts logged
- Optional 2FA via authenticator app

---

## Real-time Notifications

### Bell Icon in Header

- Badge shows unread count
- Dropdown with latest 10
- Mark all read / View all

### Notification Types

- New order placed
- Low stock alert
- New review submitted
- Customer inquiry
- Team member joined

### Implementation

Supabase Realtime subscriptions for instant updates

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 |
| UI | shadcn/ui + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Custom JWT (separate from storefront) |
| Email | Resend |
| Real-time | Supabase Realtime |
| Charts | Recharts |
| Rich Text | Tiptap |
| Shipping | Shiprocket API |

---

## Folder Structure

```
E:/alaire/admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── invite/[token]/
│   │   └── reset-password/
│   ├── (dashboard)/
│   │   ├── layout.tsx (sidebar + header)
│   │   ├── dashboard/
│   │   ├── orders/
│   │   │   ├── page.tsx (list)
│   │   │   └── [id]/page.tsx (detail)
│   │   ├── products/
│   │   │   ├── page.tsx (list)
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx (edit)
│   │   ├── categories/
│   │   ├── customers/
│   │   ├── coupons/
│   │   ├── content/
│   │   │   ├── hero/
│   │   │   ├── blog/
│   │   │   ├── promotions/
│   │   │   └── pages/
│   │   ├── newsletter/
│   │   │   ├── subscribers/
│   │   │   ├── campaigns/
│   │   │   └── templates/
│   │   ├── analytics/
│   │   │   ├── sales/
│   │   │   ├── inventory/
│   │   │   └── customers/
│   │   ├── team/
│   │   ├── settings/
│   │   └── activity/
│   └── api/
├── components/
│   ├── ui/ (shadcn)
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── editor/
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── shiprocket/
│   └── resend/
└── hooks/
```

---

## Database Migrations

### New Tables

```sql
-- Admin users (separate from customers)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin sessions
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  category_ids UUID[],
  product_ids UUID[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email subscribers
CREATE TABLE email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT,
  is_subscribed BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email campaigns
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_activity_log_admin ON activity_log(admin_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_notifications_admin ON admin_notifications(admin_id, is_read);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_subscribers_email ON email_subscribers(email);
```

---

## Next Steps

1. **Create implementation plan** using superpowers:writing-plans
2. **Set up git worktree** for isolated development
3. **Begin implementation** in phases:
   - Phase 1: Auth + Dashboard + Orders
   - Phase 2: Products + Categories + Inventory
   - Phase 3: Customers + Coupons
   - Phase 4: Content + Newsletter
   - Phase 5: Analytics + Settings
