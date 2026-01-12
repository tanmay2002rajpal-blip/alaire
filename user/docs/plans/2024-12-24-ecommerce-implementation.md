# E-commerce Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a minimal, high-end e-commerce storefront with product variants, cart, checkout (Razorpay), user accounts, wishlist, reviews, wallet, and blog.

**Architecture:** Next.js 16 App Router with Server Components for data fetching, Client Components for interactivity. Supabase handles auth, database, and file storage. Razorpay for payments.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui (New York), Supabase, Razorpay, Resend

---

## Phase 1: Project Setup & Foundation

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Step 2: Install shadcn/ui CLI and initialize**

```bash
npx shadcn@latest init
```

When prompted:
- Style: New York
- Base color: Zinc
- CSS variables: Yes

**Step 3: Install additional dependencies**

```bash
npm install razorpay resend zustand sonner lucide-react
```

**Step 4: Install dev dependencies**

```bash
npm install -D @types/razorpay
```

**Step 5: Verify installation**

Run: `npm run dev`
Expected: Dev server starts without errors

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: install core dependencies (supabase, shadcn, razorpay, resend)"
```

---

### Task 2: Configure Environment Variables

**Files:**
- Create: `.env.local`
- Modify: `.env.example` (create for reference)

**Step 1: Create .env.local**

```bash
# Create .env.local with placeholder values
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Resend
RESEND_API_KEY=your_resend_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 2: Create .env.example (for documentation)**

```env
# Supabase - Get from https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Razorpay - Get from https://dashboard.razorpay.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Resend - Get from https://resend.com
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 3: Add .env.local to .gitignore (verify it's there)**

Run: `grep ".env.local" .gitignore`
Expected: `.env.local` found in gitignore

**Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "feat: add environment variable template"
```

---

### Task 3: Setup Supabase Client

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`

**Step 1: Create browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create server client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )
}
```

**Step 3: Create middleware helper**

Create `lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}
```

**Step 4: Create middleware.ts at root**

Create `middleware.ts`:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add lib/supabase/ middleware.ts
git commit -m "feat: setup supabase client for browser, server, and middleware"
```

---

### Task 4: Create Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create migrations directory**

```bash
mkdir -p supabase/migrations
```

**Step 2: Create initial schema migration**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  has_variants BOOLEAN DEFAULT FALSE,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Options (Color, Size, etc.)
CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  values TEXT[] NOT NULL DEFAULT '{}',
  position INTEGER DEFAULT 0
);

-- Product Variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  options JSONB DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Product Details (tabs)
CREATE TABLE product_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  tab_name TEXT NOT NULL,
  content TEXT,
  position INTEGER DEFAULT 0
);

-- Cart Items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Codes
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed_amount')) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_address JSONB,
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE SET NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  wallet_amount_used DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  image_url TEXT
);

-- Order Status History
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Wishlists
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recently Viewed
CREATE TABLE recently_viewed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Related Products
CREATE TABLE related_products (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  related_product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (product_id, related_product_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('order_update', 'back_in_stock', 'promo', 'price_drop')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter Subscribers
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- Blog Posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Settings
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flat_shipping_rate DECIMAL(10,2) DEFAULT 50,
  free_shipping_threshold DECIMAL(10,2) DEFAULT 999,
  instagram_username TEXT,
  loyalty_points_per_rupee DECIMAL(10,4) DEFAULT 0.01,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default store settings
INSERT INTO store_settings (id) VALUES (uuid_generate_v4());

-- Create indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Also create wallet for new user
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 10) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM orders
  WHERE order_number LIKE 'ORD-' || year_part || '-%';

  RETURN 'ORD-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

**Step 3: Document how to run migration**

Note: Run this SQL in the Supabase SQL Editor at `https://supabase.com/dashboard/project/YOUR_PROJECT/sql`

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema migration"
```

---

### Task 5: Create TypeScript Types

**Files:**
- Create: `types/database.ts`
- Create: `types/index.ts`

**Step 1: Create database types**

Create `types/database.ts`:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          full_name: string
          phone: string
          line1: string
          line2: string | null
          city: string
          state: string
          pincode: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          full_name: string
          phone: string
          line1: string
          line2?: string | null
          city: string
          state: string
          pincode: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          full_name?: string
          phone?: string
          line1?: string
          line2?: string | null
          city?: string
          state?: string
          pincode?: string
          is_default?: boolean
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          position: number
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          position?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          position?: number
          is_active?: boolean
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string | null
          images: string[]
          has_variants: boolean
          base_price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category_id?: string | null
          images?: string[]
          has_variants?: boolean
          base_price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category_id?: string | null
          images?: string[]
          has_variants?: boolean
          base_price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_options: {
        Row: {
          id: string
          product_id: string
          name: string
          values: string[]
          position: number
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          values: string[]
          position?: number
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          values?: string[]
          position?: number
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string | null
          price: number
          compare_at_price: number | null
          stock_quantity: number
          options: Json
          image_url: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          sku?: string | null
          price: number
          compare_at_price?: number | null
          stock_quantity?: number
          options?: Json
          image_url?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          sku?: string | null
          price?: number
          compare_at_price?: number | null
          stock_quantity?: number
          options?: Json
          image_url?: string | null
          is_active?: boolean
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          variant_id?: string | null
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          variant_id?: string | null
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          status: string
          subtotal: number
          discount_amount: number
          shipping_cost: number
          total: number
          shipping_address: Json | null
          discount_code_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          wallet_amount_used: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id?: string | null
          status?: string
          subtotal: number
          discount_amount?: number
          shipping_cost?: number
          total: number
          shipping_address?: Json | null
          discount_code_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          wallet_amount_used?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          status?: string
          subtotal?: number
          discount_amount?: number
          shipping_cost?: number
          total?: number
          shipping_address?: Json | null
          discount_code_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          wallet_amount_used?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          updated_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          flat_shipping_rate: number
          free_shipping_threshold: number
          instagram_username: string | null
          loyalty_points_per_rupee: number
          updated_at: string
        }
        Insert: {
          id?: string
          flat_shipping_rate?: number
          free_shipping_threshold?: number
          instagram_username?: string | null
          loyalty_points_per_rupee?: number
          updated_at?: string
        }
        Update: {
          id?: string
          flat_shipping_rate?: number
          free_shipping_threshold?: number
          instagram_username?: string | null
          loyalty_points_per_rupee?: number
          updated_at?: string
        }
      }
    }
  }
}
```

**Step 2: Create index exports**

Create `types/index.ts`:

```typescript
export * from './database'

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type ProductOption = Database['public']['Tables']['product_options']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Wishlist = Database['public']['Tables']['wishlists']['Row']
export type Wallet = Database['public']['Tables']['wallets']['Row']
export type StoreSettings = Database['public']['Tables']['store_settings']['Row']

import { Database } from './database'

// Product with relations
export type ProductWithDetails = Product & {
  category: Category | null
  variants: ProductVariant[]
  options: ProductOption[]
}

// Cart item with product details
export type CartItemWithProduct = CartItem & {
  product: Product
  variant: ProductVariant | null
}
```

**Step 3: Update lib/supabase/types.ts to re-export**

Create `lib/supabase/types.ts`:

```typescript
export type { Database } from '@/types/database'
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add types/ lib/supabase/types.ts
git commit -m "feat: add TypeScript types for database schema"
```

---

### Task 6: Install shadcn/ui Components

**Files:**
- Create: `components/ui/*.tsx` (multiple files)

**Step 1: Install core UI components**

```bash
npx shadcn@latest add button input label card sheet dialog tabs toast sonner separator avatar badge skeleton
```

**Step 2: Install form components**

```bash
npx shadcn@latest add form select textarea checkbox radio-group
```

**Step 3: Install navigation components**

```bash
npx shadcn@latest add dropdown-menu navigation-menu command
```

**Step 4: Verify components installed**

Run: `ls components/ui/`
Expected: Multiple .tsx files (button.tsx, input.tsx, etc.)

**Step 5: Commit**

```bash
git add components/ui/
git commit -m "feat: install shadcn/ui components"
```

---

### Task 7: Create Utility Functions

**Files:**
- Create: `lib/utils.ts`
- Create: `lib/constants.ts`

**Step 1: Create utils.ts**

Create `lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getDiscountPercentage(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}
```

**Step 2: Create constants.ts**

Create `lib/constants.ts`:

```typescript
export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
} as const

export const NAV_LINKS = [
  { href: '/products', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
  { href: '/blog', label: 'Blog' },
] as const

export const FOOTER_LINKS = {
  shop: [
    { href: '/products', label: 'All Products' },
    { href: '/categories', label: 'Categories' },
  ],
  account: [
    { href: '/account', label: 'My Account' },
    { href: '/account/orders', label: 'Orders' },
    { href: '/account/wishlist', label: 'Wishlist' },
  ],
  help: [
    { href: '/contact', label: 'Contact Us' },
    { href: '/shipping', label: 'Shipping Info' },
    { href: '/returns', label: 'Returns' },
  ],
} as const

export const PAYMENT_METHODS = ['visa', 'mastercard', 'upi', 'razorpay'] as const
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/utils.ts lib/constants.ts
git commit -m "feat: add utility functions and constants"
```

---

## Phase 1 Complete Checkpoint

At this point you should have:
- All dependencies installed
- Supabase client configured
- Database schema ready to deploy
- TypeScript types defined
- shadcn/ui components installed
- Utility functions ready

**Verify everything works:**

```bash
npm run dev
npm run build
```

Expected: Both commands succeed without errors.

---

## Phase 2: Layout Components

### Task 8: Create Header Component

**Files:**
- Create: `components/layout/header.tsx`
- Create: `components/layout/logo.tsx`
- Create: `components/layout/nav-links.tsx`
- Create: `components/layout/cart-button.tsx`
- Create: `components/layout/user-button.tsx`

**Step 1: Create Logo component**

Create `components/layout/logo.tsx`:

```typescript
import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="text-xl font-semibold tracking-tight">
      STORE
    </Link>
  )
}
```

**Step 2: Create NavLinks component**

Create `components/layout/nav-links.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/lib/constants'

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-foreground/80',
            pathname === link.href ? 'text-foreground' : 'text-foreground/60'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
```

**Step 3: Create CartButton component**

Create `components/layout/cart-button.tsx`:

```typescript
'use client'

import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CartButtonProps {
  itemCount?: number
}

export function CartButton({ itemCount = 0 }: CartButtonProps) {
  return (
    <Button variant="ghost" size="icon" className="relative">
      <ShoppingBag className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-[10px] font-medium text-background flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
      <span className="sr-only">Cart</span>
    </Button>
  )
}
```

**Step 4: Create UserButton component**

Create `components/layout/user-button.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserButtonProps {
  user?: { id: string; email?: string } | null
}

export function UserButton({ user }: UserButtonProps) {
  if (!user) {
    return (
      <Button variant="ghost" size="icon" asChild>
        <Link href="/auth/login">
          <User className="h-5 w-5" />
          <span className="sr-only">Login</span>
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">Account</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/account">My Account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders">Orders</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/wishlist">Wishlist</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Step 5: Create Header component**

Create `components/layout/header.tsx`:

```typescript
import { Logo } from './logo'
import { NavLinks } from './nav-links'
import { CartButton } from './cart-button'
import { UserButton } from './user-button'
import { createClient } from '@/lib/supabase/server'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <NavLinks />
        </div>
        <div className="flex items-center gap-2">
          <CartButton />
          <UserButton user={user} />
        </div>
      </div>
    </header>
  )
}
```

**Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add components/layout/
git commit -m "feat: add header component with logo, nav, cart, and user button"
```

---

### Task 9: Create Footer Component

**Files:**
- Create: `components/layout/footer.tsx`
- Create: `components/layout/newsletter-form.tsx`

**Step 1: Create NewsletterForm component**

Create `components/layout/newsletter-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')

    // TODO: Implement newsletter subscription
    await new Promise(resolve => setTimeout(resolve, 1000))

    setStatus('success')
    setEmail('')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Stay Updated</h3>
      <p className="text-sm text-muted-foreground">
        Subscribe to our newsletter for updates and offers.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
            disabled={status === 'loading'}
          />
        </div>
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
      {status === 'success' && (
        <p className="text-sm text-green-600">Thanks for subscribing!</p>
      )}
    </div>
  )
}
```

**Step 2: Create Footer component**

Create `components/layout/footer.tsx`:

```typescript
import Link from 'next/link'
import { Logo } from './logo'
import { NewsletterForm } from './newsletter-form'
import { FOOTER_LINKS } from '@/lib/constants'
import { Instagram, Facebook, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-xs">
              Curated collection of premium products for the modern lifestyle.
            </p>
            <NewsletterForm />
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="font-semibold mb-4">Help</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.help.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Store. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

**Step 3: Commit**

```bash
git add components/layout/footer.tsx components/layout/newsletter-form.tsx
git commit -m "feat: add footer component with newsletter form"
```

---

### Task 10: Create Store Layout

**Files:**
- Create: `app/(store)/layout.tsx`
- Modify: `app/layout.tsx`
- Create: `components/layout/index.ts`

**Step 1: Create layout exports**

Create `components/layout/index.ts`:

```typescript
export { Header } from './header'
export { Footer } from './footer'
export { Logo } from './logo'
export { NavLinks } from './nav-links'
export { CartButton } from './cart-button'
export { UserButton } from './user-button'
export { NewsletterForm } from './newsletter-form'
```

**Step 2: Update root layout**

Modify `app/layout.tsx`:

```typescript
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Store",
    template: "%s | Store",
  },
  description: "Curated collection of premium products",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

**Step 3: Create store layout**

Create `app/(store)/layout.tsx`:

```typescript
import { Header, Footer } from '@/components/layout'

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

**Step 4: Move/update home page**

Move `app/page.tsx` to `app/(store)/page.tsx` and update:

```typescript
export default function HomePage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold tracking-tight">Welcome to the Store</h1>
      <p className="mt-4 text-muted-foreground">
        Curated collection of premium products for the modern lifestyle.
      </p>
    </div>
  )
}
```

**Step 5: Test the layout**

Run: `npm run dev`
Navigate to: `http://localhost:3000`
Expected: See header, home content, and footer

**Step 6: Commit**

```bash
git add app/ components/layout/index.ts
git commit -m "feat: add store layout with header and footer"
```

---

This plan continues with Tasks 11-40+ covering:
- Product listing and detail pages
- Cart functionality (Zustand store + UI)
- Authentication pages
- Checkout with Razorpay
- Account pages
- Wishlist, Reviews, Search
- Wallet system
- And more...

---

**Plan complete and saved to `docs/plans/2024-12-24-ecommerce-implementation.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
