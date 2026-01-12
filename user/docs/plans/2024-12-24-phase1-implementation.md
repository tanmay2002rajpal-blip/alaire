# Phase 1: Core Shopping Experience Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement search dialog, categories pages, and order detail page to complete the core shopping flow.

**Architecture:** Next.js App Router with Server Components for data fetching, Client Components for interactivity. Supabase for database queries. GSAP for animations consistent with existing codebase patterns.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, shadcn/ui (Command component), Supabase, GSAP, Zustand

---

## Task 1: Create Search Server Action

**Files:**
- Create: `lib/actions/search.ts`

**Step 1: Create the search action file**

Create `lib/actions/search.ts`:

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import type { Product, Category } from "@/types"

export interface SearchResult {
  products: Array<{
    id: string
    name: string
    slug: string
    price: number
    image: string | null
  }>
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
}

export async function searchProducts(query: string): Promise<SearchResult> {
  if (!query || query.length < 2) {
    return { products: [], categories: [] }
  }

  const supabase = await createClient()
  const searchTerm = `%${query}%`

  // Search products
  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      base_price,
      images,
      variants:product_variants(price)
    `)
    .eq("is_active", true)
    .ilike("name", searchTerm)
    .limit(5)

  // Search categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .ilike("name", searchTerm)
    .limit(3)

  return {
    products: (products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.variants?.[0]?.price ?? p.base_price,
      image: p.images?.[0] ?? null,
    })),
    categories: categories ?? [],
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/actions/search.ts
git commit -m "feat(search): add server action for product and category search"
```

---

## Task 2: Create Search Dialog Component

**Files:**
- Create: `components/layout/search-dialog.tsx`

**Step 1: Create the search dialog component**

Create `components/layout/search-dialog.tsx`:

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Clock, Folder, Search, X } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { searchProducts, type SearchResult } from "@/lib/actions/search"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"

const RECENT_SEARCHES_KEY = "recent-searches"
const MAX_RECENT_SEARCHES = 5

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return
  try {
    const recent = getRecentSearches().filter((s) => s !== query)
    recent.unshift(query)
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES))
    )
  } catch {}
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult>({ products: [], categories: [] })
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load recent searches on mount
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches())
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ products: [], categories: [] })
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const data = await searchProducts(query)
        setResults(data)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback(
    (href: string, searchQuery?: string) => {
      if (searchQuery) {
        saveRecentSearch(searchQuery)
      }
      onOpenChange(false)
      setQuery("")
      router.push(href)
    },
    [router, onOpenChange]
  )

  const handleRecentSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
  }, [])

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
    setRecentSearches([])
  }, [])

  const hasResults = results.products.length > 0 || results.categories.length > 0
  const showRecent = !query && recentSearches.length > 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search for products and categories"
    >
      <CommandInput
        placeholder="Search products..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}

        {!isLoading && query.length >= 2 && !hasResults && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {/* Recent Searches */}
        {showRecent && (
          <CommandGroup
            heading={
              <div className="flex items-center justify-between">
                <span>Recent Searches</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            }
          >
            {recentSearches.map((search) => (
              <CommandItem
                key={search}
                value={search}
                onSelect={() => handleRecentSearch(search)}
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {search}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Categories */}
        {results.categories.length > 0 && (
          <CommandGroup heading="Categories">
            {results.categories.map((category) => (
              <CommandItem
                key={category.id}
                value={`category-${category.slug}`}
                onSelect={() => handleSelect(`/categories/${category.slug}`, query)}
              >
                <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                {category.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.categories.length > 0 && results.products.length > 0 && (
          <CommandSeparator />
        )}

        {/* Products */}
        {results.products.length > 0 && (
          <CommandGroup heading="Products">
            {results.products.map((product) => (
              <CommandItem
                key={product.id}
                value={`product-${product.slug}`}
                onSelect={() => handleSelect(`/products/${product.slug}`, query)}
                className="flex items-center gap-3"
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* View all results */}
        {query.length >= 2 && hasResults && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="view-all"
                onSelect={() => handleSelect(`/products?search=${encodeURIComponent(query)}`, query)}
              >
                <Search className="mr-2 h-4 w-4" />
                View all results for "{query}"
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/layout/search-dialog.tsx
git commit -m "feat(search): add command palette search dialog component"
```

---

## Task 3: Integrate Search Dialog with Header

**Files:**
- Modify: `components/layout/header.tsx`
- Modify: `components/layout/index.ts`

**Step 1: Update header to use search dialog**

Modify `components/layout/header.tsx`:

Add import at top:
```typescript
import { SearchDialog } from "./search-dialog"
```

Add state after existing state declarations (around line 31):
```typescript
const [isSearchOpen, setIsSearchOpen] = useState(false)
```

Add keyboard shortcut effect after existing useEffect blocks (around line 90):
```typescript
// Keyboard shortcut for search
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      setIsSearchOpen(true)
    }
  }

  window.addEventListener("keydown", handleKeyDown)
  return () => window.removeEventListener("keydown", handleKeyDown)
}, [])
```

Update the search button (around line 168-175) to:
```typescript
{/* Search */}
<Button
  variant="ghost"
  size="icon"
  className="header-action h-10 w-10 rounded-full"
  onClick={() => setIsSearchOpen(true)}
>
  <Search className="h-5 w-5" />
  <span className="sr-only">Search (⌘K)</span>
</Button>
```

Add SearchDialog before closing `</header>` tag:
```typescript
<SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
```

**Step 2: Update layout exports**

Modify `components/layout/index.ts` - add export:
```typescript
export { SearchDialog } from "./search-dialog"
```

**Step 3: Test the search**

Run: `npm run dev`
Navigate to: `http://localhost:3000`
Test:
1. Press `⌘K` (Mac) or `Ctrl+K` (Windows) - dialog should open
2. Click search icon - dialog should open
3. Type "shirt" - should see results after 300ms
4. Click a result - should navigate and close dialog
Expected: All tests pass

**Step 4: Commit**

```bash
git add components/layout/header.tsx components/layout/index.ts
git commit -m "feat(search): integrate search dialog with header and keyboard shortcut"
```

---

## Task 4: Add Categories Query with Product Counts

**Files:**
- Modify: `lib/supabase/queries.ts`

**Step 1: Add getCategoriesWithCounts function**

Add to `lib/supabase/queries.ts` after the existing `getCategories` function:

```typescript
export type CategoryWithCount = Category & {
  product_count: number
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select(`
      *,
      products:products(count)
    `)
    .eq("is_active", true)
    .order("position", { ascending: true })

  if (error) {
    console.error("Error fetching categories with counts:", error)
    return []
  }

  return (data ?? []).map((category) => ({
    ...category,
    product_count: category.products?.[0]?.count ?? 0,
  }))
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching category:", error)
    return null
  }

  return data
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/supabase/queries.ts
git commit -m "feat(categories): add queries for categories with product counts"
```

---

## Task 5: Create Category Card Component

**Files:**
- Create: `components/categories/category-card.tsx`

**Step 1: Create the component**

Create `components/categories/category-card.tsx`:

```typescript
"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { gsap } from "gsap"
import { CATEGORY_IMAGES } from "@/lib/sample-images"
import type { Category } from "@/types"

interface CategoryCardProps {
  category: Category & { product_count?: number }
  index?: number
}

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)

  const handleMouseEnter = () => {
    if (!cardRef.current) return
    const img = cardRef.current.querySelector("img")
    if (img) {
      gsap.to(img, { scale: 1.08, duration: 0.6, ease: "power3.out" })
    }
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    const img = cardRef.current.querySelector("img")
    if (img) {
      gsap.to(img, { scale: 1, duration: 0.6, ease: "power3.out" })
    }
  }

  const imageUrl =
    category.image_url ||
    CATEGORY_IMAGES[category.slug as keyof typeof CATEGORY_IMAGES] ||
    CATEGORY_IMAGES["new-arrivals"]

  return (
    <Link
      ref={cardRef}
      href={`/categories/${category.slug}`}
      className="category-card group relative aspect-[4/3] overflow-hidden bg-muted"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={imageUrl}
        alt={category.name}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-out"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-500" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-serif text-xl font-medium text-white lg:text-2xl">
              {category.name}
            </h3>
            {category.product_count !== undefined && (
              <p className="mt-1 text-sm text-white/70">
                {category.product_count} {category.product_count === 1 ? "product" : "products"}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-foreground">
            <ArrowUpRight className="h-5 w-5 text-white group-hover:text-foreground" />
          </div>
        </div>
      </div>
    </Link>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/categories/category-card.tsx
git commit -m "feat(categories): add category card component with GSAP hover"
```

---

## Task 6: Create Categories Index Export

**Files:**
- Create: `components/categories/index.ts`

**Step 1: Create the export file**

Create `components/categories/index.ts`:

```typescript
export { CategoryCard } from "./category-card"
```

**Step 2: Commit**

```bash
git add components/categories/index.ts
git commit -m "feat(categories): add component exports"
```

---

## Task 7: Implement Categories Listing Page

**Files:**
- Modify: `app/(store)/categories/page.tsx`

**Step 1: Replace placeholder with full implementation**

Replace `app/(store)/categories/page.tsx`:

```typescript
import type { Metadata } from "next"
import { getCategoriesWithCounts } from "@/lib/supabase/queries"
import { CategoryCard } from "@/components/categories"
import { FadeIn, StaggerReveal } from "@/components/animated"

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse our curated collections by category",
}

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts()

  return (
    <div className="container py-12 lg:py-16">
      {/* Header */}
      <FadeIn>
        <div className="mb-10 max-w-2xl lg:mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Collections
          </span>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight md:text-5xl">
            Shop by Category
          </h1>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Explore our carefully curated collections, each crafted to inspire your style.
          </p>
        </div>
      </FadeIn>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <StaggerReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </StaggerReveal>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No categories found</p>
          <p className="mt-2 text-muted-foreground">
            Check back soon for new collections
          </p>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Test the page**

Run: `npm run dev`
Navigate to: `http://localhost:3000/categories`
Expected: See grid of category cards with images and product counts

**Step 3: Commit**

```bash
git add app/(store)/categories/page.tsx
git commit -m "feat(categories): implement categories listing page with grid"
```

---

## Task 8: Create Category Hero Component

**Files:**
- Create: `components/categories/category-hero.tsx`

**Step 1: Create the component**

Create `components/categories/category-hero.tsx`:

```typescript
"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { gsap } from "gsap"
import { CATEGORY_IMAGES } from "@/lib/sample-images"
import type { Category } from "@/types"

interface CategoryHeroProps {
  category: Category
}

export function CategoryHero({ category }: CategoryHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!heroRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-content > *",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          delay: 0.2,
        }
      )
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const imageUrl =
    category.image_url ||
    CATEGORY_IMAGES[category.slug as keyof typeof CATEGORY_IMAGES] ||
    CATEGORY_IMAGES["new-arrivals"]

  return (
    <div ref={heroRef} className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src={imageUrl}
        alt={category.name}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="container pb-10 lg:pb-14">
          <div className="hero-content max-w-2xl text-white">
            {/* Breadcrumb */}
            <nav className="mb-4 flex items-center gap-2 text-sm text-white/70">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/categories" className="hover:text-white transition-colors">
                Categories
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{category.name}</span>
            </nav>

            {/* Title */}
            <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
              {category.name}
            </h1>

            {/* Description */}
            {category.description && (
              <p className="mt-4 text-lg text-white/80 md:text-xl">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Update exports**

Add to `components/categories/index.ts`:
```typescript
export { CategoryHero } from "./category-hero"
```

**Step 3: Commit**

```bash
git add components/categories/category-hero.tsx components/categories/index.ts
git commit -m "feat(categories): add category hero banner component"
```

---

## Task 9: Implement Category Detail Page

**Files:**
- Create: `app/(store)/categories/[slug]/page.tsx`

**Step 1: Create the page**

Create directory and file `app/(store)/categories/[slug]/page.tsx`:

```typescript
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCategoryBySlug, getProducts } from "@/lib/supabase/queries"
import { CategoryHero } from "@/components/categories"
import { ProductGrid, ProductFilters } from "@/components/products"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return { title: "Category Not Found" }
  }

  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} collection`,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams

  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  // Parse filter params
  const sort = (resolvedSearchParams.sort as string) ?? "newest"
  const priceMin = resolvedSearchParams.priceMin
    ? Number(resolvedSearchParams.priceMin)
    : undefined
  const priceMax = resolvedSearchParams.priceMax
    ? Number(resolvedSearchParams.priceMax)
    : undefined

  const products = await getProducts({
    category: slug,
    sort: sort as "newest" | "price_asc" | "price_desc" | "name_asc",
    priceMin,
    priceMax,
  })

  return (
    <div>
      {/* Hero Banner */}
      <CategoryHero category={category} />

      {/* Products Section */}
      <div className="container py-10 lg:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
          <ProductFilters />
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} columns={4} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium">No products found</p>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or check back soon
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Test the page**

Run: `npm run dev`
Navigate to: `http://localhost:3000/categories/[any-category-slug]`
Expected: See hero banner with category info and product grid below

**Step 3: Commit**

```bash
git add app/(store)/categories/[slug]/page.tsx
git commit -m "feat(categories): implement category detail page with hero and products"
```

---

## Task 10: Add Order Query Function

**Files:**
- Modify: `lib/supabase/queries.ts`

**Step 1: Add getOrderById function**

Add to `lib/supabase/queries.ts`:

```typescript
export interface OrderWithDetails {
  id: string
  order_number: string
  user_id: string
  status: string
  subtotal: number
  discount_amount: number
  shipping_cost: number
  total: number
  shipping_address: any
  wallet_amount_used: number
  notes: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  created_at: string
  updated_at: string
  items: Array<{
    id: string
    product_id: string | null
    variant_id: string | null
    product_name: string
    variant_name: string | null
    quantity: number
    price_at_purchase: number
    image_url: string | null
  }>
  status_history: Array<{
    id: string
    status: string
    note: string | null
    created_at: string
  }>
}

export async function getOrderById(
  orderId: string,
  userId: string
): Promise<OrderWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(
        id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        quantity,
        price_at_purchase,
        image_url
      ),
      status_history:order_status_history(
        id,
        status,
        note,
        created_at
      )
    `)
    .eq("id", orderId)
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("Error fetching order:", error)
    return null
  }

  return data as OrderWithDetails
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/supabase/queries.ts
git commit -m "feat(orders): add getOrderById query with items and status history"
```

---

## Task 11: Create Order Timeline Component

**Files:**
- Create: `components/account/order-timeline.tsx`

**Step 1: Create the component**

Create `components/account/order-timeline.tsx`:

```typescript
"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ORDER_STATUSES } from "@/lib/constants"

const TIMELINE_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const

interface StatusHistoryItem {
  status: string
  created_at: string
}

interface OrderTimelineProps {
  currentStatus: string
  statusHistory: StatusHistoryItem[]
}

export function OrderTimeline({ currentStatus, statusHistory }: OrderTimelineProps) {
  // Handle cancelled/refunded as special states
  if (currentStatus === "cancelled" || currentStatus === "refunded") {
    const statusConfig = ORDER_STATUSES[currentStatus as keyof typeof ORDER_STATUSES]
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-6">
        <div className="text-center">
          <span className={cn("inline-block rounded-full px-3 py-1 text-sm font-medium", statusConfig?.color)}>
            {statusConfig?.label ?? currentStatus}
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            This order has been {currentStatus}
          </p>
        </div>
      </div>
    )
  }

  const currentStepIndex = TIMELINE_STEPS.findIndex((step) => step.key === currentStatus)

  // Build a map of status -> timestamp
  const statusTimestamps: Record<string, string> = {}
  statusHistory.forEach((item) => {
    statusTimestamps[item.status] = item.created_at
  })

  return (
    <div className="relative">
      {/* Progress bar background */}
      <div className="absolute left-0 top-4 h-0.5 w-full bg-muted" />

      {/* Active progress bar */}
      <div
        className="absolute left-0 top-4 h-0.5 bg-foreground transition-all duration-500"
        style={{
          width: `${(currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100}%`,
        }}
      />

      {/* Steps */}
      <div className="relative flex justify-between">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isCurrent = index === currentStepIndex
          const timestamp = statusTimestamps[step.key]

          return (
            <div key={step.key} className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted
                    ? "border-foreground bg-foreground text-background"
                    : isCurrent
                    ? "border-foreground bg-background text-foreground"
                    : "border-muted bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>

              {/* Timestamp */}
              {timestamp && (
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(timestamp).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/account/order-timeline.tsx
git commit -m "feat(orders): add order status timeline component"
```

---

## Task 12: Create Order Items Component

**Files:**
- Create: `components/account/order-items.tsx`

**Step 1: Create the component**

Create `components/account/order-items.tsx`:

```typescript
import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface OrderItem {
  id: string
  product_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  price_at_purchase: number
  image_url: string | null
}

interface OrderItemsProps {
  items: OrderItem[]
}

export function OrderItems({ items }: OrderItemsProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-4">
          {/* Image */}
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.product_name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col justify-center">
            <h4 className="font-medium leading-tight">{item.product_name}</h4>
            {item.variant_name && (
              <p className="text-sm text-muted-foreground">{item.variant_name}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Qty: {item.quantity} &times; {formatPrice(item.price_at_purchase)}
            </p>
          </div>

          {/* Subtotal */}
          <div className="flex items-center">
            <span className="font-medium">
              {formatPrice(item.quantity * item.price_at_purchase)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Update account component exports**

Add to `components/account/index.ts`:
```typescript
export { OrderTimeline } from "./order-timeline"
export { OrderItems } from "./order-items"
```

**Step 3: Commit**

```bash
git add components/account/order-items.tsx components/account/index.ts
git commit -m "feat(orders): add order items list component"
```

---

## Task 13: Implement Order Detail Page

**Files:**
- Create: `app/(store)/account/orders/[id]/page.tsx`

**Step 1: Create the page**

Create directory and file `app/(store)/account/orders/[id]/page.tsx`:

```typescript
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, Copy, HelpCircle, RotateCcw, Truck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getOrderById } from "@/lib/supabase/queries"
import { formatPrice, formatDate } from "@/lib/utils"
import { ORDER_STATUSES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { OrderTimeline, OrderItems } from "@/components/account"
import { ReorderButton } from "./reorder-button"
import { CopyButton } from "./copy-button"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Order #${id.slice(0, 8).toUpperCase()}`,
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const order = await getOrderById(id, user.id)

  if (!order) {
    notFound()
  }

  const statusConfig = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] ?? {
    label: order.status,
    color: "bg-gray-100 text-gray-800",
  }

  const shippingAddress = order.shipping_address as {
    full_name?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
  } | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/account/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline
            currentStatus={order.status}
            statusHistory={order.status_history}
          />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItems items={order.items} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Address */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">
                    -{formatPrice(order.discount_amount)}
                  </span>
                </div>
              )}
              {order.wallet_amount_used > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wallet</span>
                  <span className="text-green-600">
                    -{formatPrice(order.wallet_amount_used)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {order.shipping_cost === 0
                    ? "Free"
                    : formatPrice(order.shipping_cost)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {shippingAddress.full_name}
                  </span>
                  <br />
                  {shippingAddress.line1}
                  {shippingAddress.line2 && (
                    <>
                      <br />
                      {shippingAddress.line2}
                    </>
                  )}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state}{" "}
                  {shippingAddress.pincode}
                  {shippingAddress.phone && (
                    <>
                      <br />
                      Phone: {shippingAddress.phone}
                    </>
                  )}
                </address>
              </CardContent>
            </Card>
          )}

          {/* Tracking (if shipped) */}
          {(order.status === "shipped" || order.status === "delivered") &&
            order.razorpay_order_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <code className="text-sm">
                      {order.razorpay_order_id}
                    </code>
                    <CopyButton text={order.razorpay_order_id} />
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <ReorderButton items={order.items} />
        <Button variant="outline" asChild>
          <Link href="/contact">
            <HelpCircle className="mr-2 h-4 w-4" />
            Need Help?
          </Link>
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Create helper client components**

Create `app/(store)/account/orders/[id]/reorder-button.tsx`:

```typescript
"use client"

import { RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks"
import { toast } from "sonner"

interface OrderItem {
  product_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  price_at_purchase: number
  image_url: string | null
}

interface ReorderButtonProps {
  items: OrderItem[]
}

export function ReorderButton({ items }: ReorderButtonProps) {
  const router = useRouter()
  const { addItem } = useCart()

  const handleReorder = () => {
    let addedCount = 0

    items.forEach((item) => {
      if (item.product_id) {
        addItem({
          productId: item.product_id,
          name: item.product_name,
          variantName: item.variant_name ?? undefined,
          price: item.price_at_purchase,
          quantity: item.quantity,
          image: item.image_url ?? undefined,
        })
        addedCount++
      }
    })

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} items to cart`)
      router.push("/cart")
    } else {
      toast.error("Could not add items to cart")
    }
  }

  return (
    <Button onClick={handleReorder}>
      <RotateCcw className="mr-2 h-4 w-4" />
      Reorder
    </Button>
  )
}
```

Create `app/(store)/account/orders/[id]/copy-button.tsx`:

```typescript
"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CopyButtonProps {
  text: string
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}
```

**Step 3: Test the page**

Run: `npm run dev`
Navigate to: `http://localhost:3000/account/orders` then click an order
Expected: See full order details with timeline, items, summary, address, and action buttons

**Step 4: Commit**

```bash
git add "app/(store)/account/orders/[id]/"
git commit -m "feat(orders): implement order detail page with timeline and reorder"
```

---

## Task 14: Final Build Verification

**Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 3: Test all features manually**

1. Search: Press `⌘K`, type "shirt", see results, click one
2. Categories: Visit `/categories`, see grid, click a category
3. Category detail: See hero + products on category page
4. Order detail: Visit `/account/orders`, click an order, see full details

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 - search, categories, order detail"
```

---

## Summary

| Task | Files Created/Modified | Description |
|------|------------------------|-------------|
| 1 | `lib/actions/search.ts` | Server action for search |
| 2 | `components/layout/search-dialog.tsx` | Command palette search UI |
| 3 | `header.tsx`, `index.ts` | Integrate search with header |
| 4 | `queries.ts` | Category queries with counts |
| 5-6 | `category-card.tsx`, `index.ts` | Category card component |
| 7 | `categories/page.tsx` | Categories listing page |
| 8 | `category-hero.tsx` | Hero banner component |
| 9 | `categories/[slug]/page.tsx` | Category detail page |
| 10 | `queries.ts` | Order query with details |
| 11-12 | `order-timeline.tsx`, `order-items.tsx` | Order display components |
| 13 | `orders/[id]/page.tsx` + helpers | Order detail page |
| 14 | - | Build verification |

**Total:** 9 new files, 5 modified files, 14 commits
