import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { ProductGrid, ProductFilters } from "@/components/products"
import { getProducts, getCategories } from "@/lib/db/queries"
import { expandProductsByColor } from "@/lib/expand-by-color"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our collection of premium products",
}

const PAGE_SIZE = 24

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    price_min?: string
    price_max?: string
    sort?: string
    filter?: string
    search?: string
    page?: string
  }>
}

function buildPageHref(
  params: Record<string, string | undefined>,
  page: number
): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue
    if (value) qs.set(key, value)
  }
  if (page > 1) qs.set("page", String(page))
  const str = qs.toString()
  return str ? `/products?${str}` : "/products"
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  )
}

async function ProductsContent({
  searchParams,
}: {
  searchParams: ProductsPageProps["searchParams"]
}) {
  const params = await searchParams

  const page = Math.max(1, parseInt(params.page || "1") || 1)
  const search = params.search?.trim() || undefined

  const products = await getProducts({
    category: params.category,
    priceMin: params.price_min ? parseInt(params.price_min) : undefined,
    priceMax: params.price_max ? parseInt(params.price_max) : undefined,
    sort: params.sort as "newest" | "price_asc" | "price_desc" | "name_asc" | undefined,
    filter: params.filter as "sale" | undefined,
    search,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  // Whether a next page likely exists is based on the RAW (pre-expansion)
  // result count so color-expansion doesn't distort pagination.
  const hasNextPage = products.length === PAGE_SIZE
  const expanded = expandProductsByColor(products)

  return (
    <div className="space-y-8">
      {search && (
        <h2 className="text-lg font-medium">
          Results for <span className="font-semibold">&ldquo;{search}&rdquo;</span>
        </h2>
      )}

      {expanded.length > 0 ? (
        <ProductGrid products={expanded} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No products found</p>
          <p className="mt-2 text-muted-foreground">
            {search
              ? `We couldn't find anything matching "${search}".`
              : "Try adjusting your filters or check back soon"}
          </p>
        </div>
      )}

      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button asChild variant="outline" size="sm">
            <Link
              href={buildPageHref(params, page - 1)}
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button asChild variant="outline" size="sm">
            <Link
              href={buildPageHref(params, page + 1)}
              aria-disabled={!hasNextPage}
              className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
            >
              Next
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const categories = await getCategories()

  return (
    <div className="container py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">All Products</h1>
        <p className="mt-2 text-muted-foreground">
          Explore our curated collection of premium products
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <ProductFilters categories={categories} />

        <div className="flex-1">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductsContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
