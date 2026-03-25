# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Alaire homepage from static grids to swipeable Embla carousels with category quick-links, tabbed New Arrivals and Best Sellers sections — inspired by Jockey.in.

**Architecture:** Install Embla Carousel for all new sliders (hero stays GSAP). Build a shared reusable carousel component, then each homepage section as a separate component. New DB queries for new arrivals and best sellers. Replace old static components, update homepage page.tsx.

**Tech Stack:** Next.js 16, React 19, Embla Carousel, GSAP (existing), Tailwind CSS 4, MongoDB aggregation pipelines

**Spec:** `docs/superpowers/specs/2026-03-26-homepage-redesign-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `user/components/ui/embla-carousel.tsx` | Reusable Embla wrapper: arrows, dots, responsive slides-per-view |
| `user/components/home/category-quick-links.tsx` | Circular category icons below hero |
| `user/components/home/on-trend-picks.tsx` | Category image carousel replacing CategoryGrid |
| `user/components/home/new-arrivals.tsx` | Tabbed product carousel with category filtering |
| `user/components/home/best-sellers.tsx` | Tabbed product carousel sorted by review count |
| `user/components/home/category-tabs.tsx` | Shared tab filter component |

### Modified Files
| File | Changes |
|------|---------|
| `user/package.json` | Add embla-carousel-react |
| `user/lib/db/queries/products.ts` | Add getNewArrivals(), getBestSellers() |
| `user/lib/db/queries/index.ts` | Re-export getNewArrivals, getBestSellers |
| `user/components/home/instagram-feed.tsx` | Convert static grid to Embla carousel |
| `user/components/home/index.ts` | Update barrel exports |
| `user/app/(store)/page.tsx` | New section order, new data fetching |

### Removed Files
| File | Reason |
|------|--------|
| `user/components/home/featured-products.tsx` | Replaced by new-arrivals.tsx |
| `user/components/home/category-grid.tsx` | Replaced by on-trend-picks.tsx |
| `user/components/home/hero-section.tsx` | Stats section removed |

---

## Task 1: Install Embla Carousel

**Files:**
- Modify: `user/package.json`

- [ ] **Step 1: Install dependencies**

```bash
cd /Volumes/Crucial\ X9/alaire/user && npm install embla-carousel-react
```

- [ ] **Step 2: Verify installation**

```bash
cd /Volumes/Crucial\ X9/alaire/user && node -e "require('embla-carousel-react'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/package.json user/package-lock.json && git commit -m "chore: add embla-carousel-react"
```

---

## Task 2: Build Reusable Embla Carousel Component

**Files:**
- Create: `user/components/ui/embla-carousel.tsx`

- [ ] **Step 1: Create the carousel component**

Create `user/components/ui/embla-carousel.tsx` with:

```tsx
"use client"

import React, { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import type { EmblaOptionsType } from "embla-carousel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmblaCarouselProps {
  children: React.ReactNode
  options?: EmblaOptionsType
  showArrows?: boolean
  showDots?: boolean
  className?: string
  slideClassName?: string
  arrowClassName?: string
  "aria-label"?: string
}

export function EmblaCarousel({
  children,
  options = { loop: true, align: "start" },
  showArrows = true,
  showDots = true,
  className,
  slideClassName,
  arrowClassName,
  "aria-label": ariaLabel,
}: EmblaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const slideCount = React.Children.count(children)
  const hideControls = slideCount <= 1

  return (
    <div
      className={cn("relative", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {React.Children.map(children, (child, index) => (
            <div
              key={index}
              className={cn("min-w-0 flex-shrink-0", slideClassName)}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && !hideControls && (
        <>
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -left-4 lg:-left-5 z-10",
              "flex h-10 w-10 items-center justify-center rounded-full",
              "border border-border bg-background/80 backdrop-blur-sm",
              "transition-all hover:bg-accent hover:text-white",
              "disabled:opacity-0 disabled:pointer-events-none",
              arrowClassName
            )}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -right-4 lg:-right-5 z-10",
              "flex h-10 w-10 items-center justify-center rounded-full",
              "border border-border bg-background/80 backdrop-blur-sm",
              "transition-all hover:bg-accent hover:text-white",
              "disabled:opacity-0 disabled:pointer-events-none",
              arrowClassName
            )}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {showDots && !hideControls && (
        <div className="flex justify-center gap-2 mt-6">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                index === selectedIndex
                  ? "bg-accent w-6"
                  : "bg-border hover:bg-accent/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Volumes/Crucial\ X9/alaire/user && npx next build --no-lint 2>&1 | head -20
```
Expected: No TypeScript errors related to embla-carousel.tsx

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/components/ui/embla-carousel.tsx && git commit -m "feat: add reusable EmblaCarousel component with arrows and dots"
```

---

## Task 3: Add New Database Queries

**Files:**
- Modify: `user/lib/db/queries/products.ts` (add after getFeaturedProducts at ~line 201)

- [ ] **Step 1: Add getNewArrivals query**

Add this function after `getFeaturedProducts` in `user/lib/db/queries/products.ts`:

```typescript
export async function getNewArrivals(
  categorySlug?: string,
  limit = 12
): Promise<ProductWithRelations[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const products = await getProducts({
    sort: "newest",
    limit,
    ...(categorySlug ? { category: categorySlug } : {}),
  })

  // Filter to last 30 days
  const recent = products.filter(
    (p) => p.created_at && new Date(p.created_at) >= thirtyDaysAgo
  )

  // Fallback: if fewer than 4 recent products, return newest regardless of date
  return recent.length >= 4 ? recent : products
}
```

- [ ] **Step 2: Add getBestSellers query**

Add this function after `getNewArrivals` in `user/lib/db/queries/products.ts`:

```typescript
export async function getBestSellers(
  _categorySlug?: string,
  limit = 12
): Promise<ProductWithRelations[]> {
  // Note: categorySlug param reserved for future server-side filtering.
  // Homepage uses client-side filtering, so this is called with undefined.
  const db = await getDb()

  try {
    const reviewAgg = await db
      .collection("reviews")
      .aggregate([
        { $match: { is_approved: true } },
        { $group: { _id: "$product_id", reviewCount: { $sum: 1 } } },
        { $sort: { reviewCount: -1 } },
        { $limit: limit * 2 },
      ])
      .toArray()

    if (reviewAgg.length === 0) {
      return getProducts({ sort: "newest", limit })
    }

    const productIds = reviewAgg.map((r) => {
      try {
        return new ObjectId(r._id as string)
      } catch {
        return null
      }
    }).filter(Boolean) as ObjectId[]

    if (productIds.length === 0) {
      return getProducts({ sort: "newest", limit })
    }

    const rawProducts = await db
      .collection("products")
      .aggregate([
        { $match: { _id: { $in: productIds }, is_active: true } },
        { $limit: limit },
        {
          $lookup: {
            from: "product_variants",
            localField: "_id",
            foreignField: "product_id",
            as: "variants",
          },
        },
        {
          $lookup: {
            from: "categories",
            let: { catId: "$category_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: [{ $toString: "$_id" }, "$$catId"] },
                },
              },
            ],
            as: "categoryArr",
          },
        },
        {
          $addFields: {
            category: { $arrayElemAt: ["$categoryArr", 0] },
          },
        },
        { $project: { categoryArr: 0 } },
      ])
      .toArray()

    // Match existing serialization pattern: serialize top-level + nested docs
    return rawProducts.map((p) => {
      const serialized = serializeDoc(p)
      return {
        ...serialized,
        variants: serializeDocs(p.variants || []),
        category: p.category ? serializeDoc(p.category) : null,
      } as unknown as ProductWithRelations
    })
  } catch {
    return getProducts({ sort: "newest", limit })
  }
}
```

- [ ] **Step 3: Update queries barrel export**

Add to `user/lib/db/queries/index.ts`:
```typescript
export { getNewArrivals, getBestSellers } from "./products"
```

- [ ] **Step 4: Verify queries compile**

```bash
cd /Volumes/Crucial\ X9/alaire/user && npx tsc --noEmit 2>&1 | grep -i "products.ts" || echo "No errors"
```
Expected: `No errors`

- [ ] **Step 5: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/lib/db/queries/products.ts user/lib/db/queries/index.ts && git commit -m "feat: add getNewArrivals and getBestSellers database queries"
```

---

## Task 4: Build Category Tabs Component

**Files:**
- Create: `user/components/home/category-tabs.tsx`

- [ ] **Step 1: Create the component**

Create `user/components/home/category-tabs.tsx`:

```tsx
"use client"

import { cn } from "@/lib/utils"

interface CategoryTabsProps {
  categories: { id: string; name: string }[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  className?: string
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto no-scrollbar",
        className
      )}
    >
      <button
        role="tab"
        aria-selected={activeCategory === "all"}
        onClick={() => onCategoryChange("all")}
        className={cn(
          "shrink-0 px-4 py-2 text-sm font-medium transition-all border-b-2",
          activeCategory === "all"
            ? "border-accent text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={activeCategory === cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={cn(
            "shrink-0 px-4 py-2 text-sm font-medium transition-all border-b-2",
            activeCategory === cat.id
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/components/home/category-tabs.tsx && git commit -m "feat: add CategoryTabs component for section filtering"
```

---

## Task 5: Build Category Quick-Links Component

**Files:**
- Create: `user/components/home/category-quick-links.tsx`

- [ ] **Step 1: Create the component**

Create `user/components/home/category-quick-links.tsx`:

```tsx
import Image from "next/image"
import Link from "next/link"
import type { Category } from "@/types"
import { CATEGORY_IMAGES } from "@/lib/sample-images"

interface CategoryQuickLinksProps {
  categories: Category[]
}

export function CategoryQuickLinks({ categories }: CategoryQuickLinksProps) {
  return (
    <section className="py-6 lg:py-8">
      <div className="container">
        <div className="flex gap-6 lg:gap-8 overflow-x-auto no-scrollbar justify-start lg:justify-center px-4 lg:px-0">
          {categories.map((category) => {
            const imageUrl =
              category.image_url ||
              (CATEGORY_IMAGES as Record<string, string>)[category.slug] ||
              null

            return (
              <Link
                key={category.id}
                href={`/collection?category=${category.slug}`}
                className="flex flex-col items-center gap-2 shrink-0 group"
              >
                <div className="relative w-[72px] h-[72px] lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-accent group-hover:scale-105 transition-all">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-accent/20 flex items-center justify-center">
                      <span className="text-xl font-serif font-semibold text-accent">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs lg:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/components/home/category-quick-links.tsx && git commit -m "feat: add CategoryQuickLinks circular icons component"
```

---

## Task 6: Build On-Trend Picks Carousel

**Files:**
- Create: `user/components/home/on-trend-picks.tsx`

- [ ] **Step 1: Create the component**

Create `user/components/home/on-trend-picks.tsx`:

```tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { EmblaCarousel } from "@/components/ui/embla-carousel"
import { CATEGORY_IMAGES } from "@/lib/sample-images"
import type { Category } from "@/types"

type CategoryWithCount = Category & { product_count: number }

interface OnTrendPicksProps {
  categories: CategoryWithCount[]
}

export function OnTrendPicks({ categories }: OnTrendPicksProps) {
  if (categories.length === 0) return null

  return (
    <section className="section">
      <div className="container">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
            On-Trend <span className="font-light italic">Picks</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            Explore Our Collections
          </p>
        </div>

        <EmblaCarousel
          options={{ loop: true, align: "start" }}
          showArrows={categories.length > 3}
          slideClassName="basis-[85%] sm:basis-[45%] lg:basis-[30%] pl-4"
          className="mx-auto"
        >
          {categories.map((category) => {
            const imageUrl =
              category.image_url ||
              (CATEGORY_IMAGES as Record<string, string>)[category.slug] ||
              null

            return (
              <Link
                key={category.id}
                href={`/collection?category=${category.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                      <span className="text-5xl font-serif font-light text-accent/60">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6 bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="text-white font-medium text-lg">
                      {category.name}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {category.product_count} Products
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </EmblaCarousel>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/components/home/on-trend-picks.tsx && git commit -m "feat: add OnTrendPicks category carousel component"
```

---

## Task 7: Build New Arrivals Section

**Files:**
- Create: `user/components/home/new-arrivals.tsx`

- [ ] **Step 1: Create the component**

Create `user/components/home/new-arrivals.tsx`:

```tsx
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { EmblaCarousel } from "@/components/ui/embla-carousel"
import { ProductCard } from "@/components/products/product-card"
import { CategoryTabs } from "./category-tabs"
import type { Product, ProductVariant, Category } from "@/types"

type ProductWithRelations = Product & {
  variants?: ProductVariant[]
  category?: { name: string; slug: string } | null
}

interface NewArrivalsProps {
  products: ProductWithRelations[]
  categories: Category[]
}

export function NewArrivals({ products, categories }: NewArrivalsProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products
    return products.filter((p) => p.category_id === activeCategory)
  }, [products, activeCategory])

  if (products.length === 0) return null

  return (
    <section className="section">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
              New Arrivals
            </h2>
            <p className="mt-2 text-muted-foreground">
              The latest additions to our collection
            </p>
          </div>
          <div className="flex items-center gap-4">
            <CategoryTabs
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
              }))}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              className="hidden sm:flex"
            />
            <Link
              href="/collection"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors shrink-0"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Mobile tabs */}
        <CategoryTabs
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
          }))}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          className="sm:hidden mb-6"
        />

        {filteredProducts.length > 0 ? (
          <EmblaCarousel
            options={{ loop: false, align: "start" }}
            showArrows={filteredProducts.length > 4}
            showDots={filteredProducts.length > 2}
            slideClassName="basis-[65%] sm:basis-[45%] lg:basis-[22%] pl-4"
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </EmblaCarousel>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No products in this category
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/collection"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/components/home/new-arrivals.tsx && git commit -m "feat: add NewArrivals tabbed carousel component"
```

---

## Task 8: Build Best Sellers Section

**Files:**
- Create: `user/components/home/best-sellers.tsx`

- [ ] **Step 1: Create the component**

Create `user/components/home/best-sellers.tsx`:

```tsx
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { EmblaCarousel } from "@/components/ui/embla-carousel"
import { ProductCard } from "@/components/products/product-card"
import { CategoryTabs } from "./category-tabs"
import type { Product, ProductVariant, Category } from "@/types"

type ProductWithRelations = Product & {
  variants?: ProductVariant[]
  category?: { name: string; slug: string } | null
}

interface BestSellersProps {
  products: ProductWithRelations[]
  categories: Category[]
}

export function BestSellers({ products, categories }: BestSellersProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products
    return products.filter((p) => p.category_id === activeCategory)
  }, [products, activeCategory])

  if (products.length === 0) return null

  return (
    <section className="section bg-muted/30">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
              Best <span className="font-light italic">Sellers</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Most Loved Styles
            </p>
          </div>
          <div className="flex items-center gap-4">
            <CategoryTabs
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
              }))}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              className="hidden sm:flex"
            />
            <Link
              href="/collection"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors shrink-0"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Mobile tabs */}
        <CategoryTabs
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
          }))}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          className="sm:hidden mb-6"
        />

        {filteredProducts.length > 0 ? (
          <EmblaCarousel
            options={{ loop: false, align: "start" }}
            showArrows={filteredProducts.length > 4}
            showDots={filteredProducts.length > 2}
            slideClassName="basis-[65%] sm:basis-[45%] lg:basis-[22%] pl-4"
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </EmblaCarousel>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No products in this category
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/collection"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/components/home/best-sellers.tsx && git commit -m "feat: add BestSellers tabbed carousel component"
```

---

## Task 9: Convert Instagram Feed to Carousel

> **Note:** This task converts InstagramFeed from a server component to a client component. The data fetching moves to page.tsx in Task 11. **Execute Tasks 9, 10, and 11 together** — the app will not compile between Task 9 and Task 11.

**Files:**
- Modify: `user/components/home/instagram-feed.tsx`

- [ ] **Step 1: Rewrite instagram-feed.tsx**

Replace the entire content of `user/components/home/instagram-feed.tsx` with a version that uses EmblaCarousel instead of the static grid. Data fetching moves to the parent page.tsx (Task 11):

```tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { Instagram, Play } from "lucide-react"
import { EmblaCarousel } from "@/components/ui/embla-carousel"
import { SOCIAL_LINKS } from "@/lib/constants"

interface InstagramPost {
  id: string
  media_url: string
  permalink: string
  caption?: string
  media_type?: string
  thumbnail_url?: string
}

interface InstagramFeedProps {
  posts: InstagramPost[]
}

export function InstagramFeed({ posts }: InstagramFeedProps) {
  if (posts.length === 0) return null

  return (
    <section className="section">
      <div className="container">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
            Follow Our <span className="font-light italic">Journey</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            @alaire on Instagram
          </p>
        </div>

        <EmblaCarousel
          options={{ loop: true, align: "start" }}
          showArrows={posts.length > 4}
          slideClassName="basis-[42%] sm:basis-[30%] lg:basis-[25%] pl-3"
        >
          {posts.map((post) => {
            const isVideo = post.media_type === "VIDEO"
            const imageUrl = isVideo
              ? post.thumbnail_url || post.media_url
              : post.media_url

            return (
              <Link
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={post.caption || "Instagram post"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 42vw, (max-width: 1024px) 30vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    {isVideo ? (
                      <Play className="h-8 w-8 text-white opacity-80" />
                    ) : (
                      <Instagram className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </EmblaCarousel>

        <div className="mt-8 text-center">
          <Link
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <Instagram className="h-4 w-4" />
            Follow us on Instagram
          </Link>
        </div>
      </div>
    </section>
  )
}
```

**Important:** This changes InstagramFeed from a server component to a client component. The data fetching (`getInstagramFeed`) must now happen in the parent `page.tsx` and be passed as props. Handle this in Task 11.

- [ ] **Step 2: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/components/home/instagram-feed.tsx && git commit -m "feat: convert InstagramFeed from static grid to Embla carousel"
```

---

## Task 10: Update Barrel Exports

**Files:**
- Modify: `user/components/home/index.ts`

- [ ] **Step 1: Update barrel exports**

Replace `user/components/home/index.ts` with:

```typescript
export { HeroCarousel } from "./hero-carousel"
export { CategoryQuickLinks } from "./category-quick-links"
export { OnTrendPicks } from "./on-trend-picks"
export { NewArrivals } from "./new-arrivals"
export { BestSellers } from "./best-sellers"
export { NewsletterSection } from "./newsletter-section"
export { InstagramFeed } from "./instagram-feed"
export { CategoryTabs } from "./category-tabs"
```

- [ ] **Step 2: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/components/home/index.ts && git commit -m "refactor: update home component barrel exports for redesign"
```

---

## Task 11: Rewrite Homepage page.tsx

**Files:**
- Modify: `user/app/(store)/page.tsx`

- [ ] **Step 1: Update the homepage**

Rewrite `user/app/(store)/page.tsx`. Key changes:
- Remove imports: HeroSection, CategoryGrid, FeaturedProducts
- Add imports: CategoryQuickLinks, OnTrendPicks, NewArrivals, BestSellers
- Remove data: getHomepageStats
- Add data: getNewArrivals, getBestSellers, getCategoriesWithCounts, getInstagramFeed
- New section order in JSX

```tsx
import { Metadata } from "next"
import {
  HeroCarousel,
  CategoryQuickLinks,
  OnTrendPicks,
  NewArrivals,
  BestSellers,
  NewsletterSection,
  InstagramFeed,
} from "@/components/home"
import {
  getNewArrivals,
  getBestSellers,
  getCategories,
  getCategoriesWithCounts,
  getHeroSlides,
} from "@/lib/db/queries"
import { getInstagramFeed } from "@/lib/instagram/api"

export const metadata: Metadata = {
  title: "Alaire — Curated Fashion",
  description:
    "Discover curated fashion pieces that blend timeless elegance with modern design.",
}

export default async function HomePage() {
  const [
    categories,
    categoriesWithCounts,
    heroSlides,
    newArrivals,
    bestSellers,
    instagramPosts,
  ] = await Promise.all([
    getCategories(),
    getCategoriesWithCounts(),
    getHeroSlides(),
    getNewArrivals(undefined, 12),
    getBestSellers(undefined, 12),
    getInstagramFeed(8).catch(() => []),
  ])

  const slides = heroSlides.map((slide) => ({
    id: slide.id,
    image: slide.image_url,
    title: slide.title,
    subtitle: slide.subtitle || "",
    description: slide.description || "",
    cta: {
      text: slide.button_text || "Shop Now",
      href: slide.button_link || "/collection",
    },
    align: "left" as const,
  }))

  return (
    <>
      <HeroCarousel slides={slides} />
      <CategoryQuickLinks categories={categories} />
      <OnTrendPicks categories={categoriesWithCounts} />
      <NewArrivals products={newArrivals} categories={categories} />
      <BestSellers products={bestSellers} categories={categories} />
      <NewsletterSection />
      <InstagramFeed posts={instagramPosts} />
    </>
  )
}
```

**Note:** Check the existing `getInstagramFeed` return type and placeholder logic. The function currently lives in `user/lib/instagram/api.ts`. If it returns placeholder data, that's fine — the carousel handles it. Wrap in `.catch(() => [])` since Instagram API may fail.

- [ ] **Step 2: Verify build**

```bash
cd /Volumes/Crucial\ X9/alaire/user && npx next build 2>&1 | tail -30
```
Expected: Build succeeds. The homepage should compile without errors.

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/app/\(store\)/page.tsx && git commit -m "feat: rewrite homepage with carousel sections and new data fetching"
```

---

## Task 12: Remove Deprecated Components

**Files:**
- Delete: `user/components/home/featured-products.tsx`
- Delete: `user/components/home/category-grid.tsx`
- Delete: `user/components/home/hero-section.tsx`

- [ ] **Step 1: Delete old components**

```bash
cd /Volumes/Crucial\ X9/alaire && rm user/components/home/featured-products.tsx user/components/home/category-grid.tsx user/components/home/hero-section.tsx
```

- [ ] **Step 2: Verify no remaining imports**

```bash
cd /Volumes/Crucial\ X9/alaire && grep -r "featured-products\|category-grid\|hero-section" user/components/ user/app/ --include="*.tsx" --include="*.ts" || echo "Clean"
```
Expected: `Clean` (no remaining references)

- [ ] **Step 3: Verify build still passes**

```bash
cd /Volumes/Crucial\ X9/alaire/user && npx next build 2>&1 | tail -20
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add -A user/components/home/ && git commit -m "refactor: remove deprecated homepage components (featured-products, category-grid, hero-section)"
```

---

## Task 13: Add GSAP ScrollTrigger Entrance Animations

**Files:**
- Modify: `user/components/home/on-trend-picks.tsx`
- Modify: `user/components/home/new-arrivals.tsx`
- Modify: `user/components/home/best-sellers.tsx`
- Modify: `user/components/home/category-quick-links.tsx`

- [ ] **Step 1: Add fade-up animations to each section**

Add a `useEffect` with GSAP ScrollTrigger to each client component. Follow the existing pattern from `featured-products.tsx`:

```tsx
// Add to each component's body:
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// Inside the component:
const sectionRef = useRef<HTMLElement>(null)

useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from(".section-heading", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: { trigger: ".section-heading", start: "top 85%", once: true },
    })
  }, sectionRef)
  return () => ctx.revert()
}, [])

// Add ref={sectionRef} to the <section> element
```

Apply this pattern to: `on-trend-picks.tsx`, `new-arrivals.tsx`, `best-sellers.tsx`. For `category-quick-links.tsx`, use a simpler fade-in (no scroll trigger since it's near top of page).

**Reduced motion:** Add to each animation setup:
```tsx
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
if (prefersReducedMotion) return
```

- [ ] **Step 2: Commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add user/components/home/ && git commit -m "feat: add GSAP ScrollTrigger entrance animations to homepage sections"
```

---

## Task 14: Visual QA and Polish

**Files:**
- Potentially modify any of the new components for visual fixes

- [ ] **Step 1: Start dev server and check desktop**

```bash
cd /Volumes/Crucial\ X9/alaire/user && npm run dev
```

Open http://localhost:3000 in the browser. Check:
- Hero carousel still works (GSAP)
- Category quick-links display with images or initials
- On-Trend Picks carousel swipes and shows arrows
- New Arrivals tabs filter correctly, carousel swipes
- Best Sellers tabs and carousel work
- Newsletter section unchanged
- Instagram feed carousel swipes

- [ ] **Step 2: Check mobile viewport (390px)**

Resize browser to 390px width or use dev tools mobile view. Check:
- Category quick-links scroll horizontally
- All carousels are swipeable with touch/mouse drag
- Dot pagination visible and functional
- Tabs scroll horizontally on mobile
- No horizontal overflow on the page

- [ ] **Step 3: Fix any visual issues found**

Apply CSS/layout fixes as needed. Common things to check:
- Slide gaps (pl-4 on slides)
- Arrow positioning (may need adjustment for container padding)
- Dot styling consistency
- Section spacing between new sections

- [ ] **Step 4: Final commit**

```bash
cd /Volumes/Crucial\ X9/alaire && git add -A && git commit -m "fix: visual polish for homepage redesign"
```
