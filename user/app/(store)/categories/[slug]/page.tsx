import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { getCategoryBySlug, getProducts, getCategories } from "@/lib/db/queries"
import { expandProductsByColor } from "@/lib/expand-by-color"
import { CategoryHero } from "@/components/categories"
import { ProductGrid, ProductFilters } from "@/components/products"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 24

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function buildCategoryPageHref(
  slug: string,
  params: { [key: string]: string | string[] | undefined },
  page: number
): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue
    const v = firstParam(value)
    if (v) qs.set(key, v)
  }
  if (page > 1) qs.set("page", String(page))
  const str = qs.toString()
  return str ? `/categories/${slug}?${str}` : `/categories/${slug}`
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

  // Parse filter params (standardized on price_min/price_max)
  const sort = firstParam(resolvedSearchParams.sort) ?? "newest"
  const priceMinRaw = firstParam(resolvedSearchParams.price_min)
  const priceMaxRaw = firstParam(resolvedSearchParams.price_max)
  const priceMin = priceMinRaw ? Number(priceMinRaw) : undefined
  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : undefined
  const page = Math.max(1, parseInt(firstParam(resolvedSearchParams.page) || "1") || 1)

  const rawProducts = await getProducts({
    category: slug,
    sort: sort as "newest" | "price_asc" | "price_desc" | "name_asc",
    priceMin,
    priceMax,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const hasNextPage = rawProducts.length === PAGE_SIZE
  const products = expandProductsByColor(rawProducts)
  const categories = await getCategories()

  return (
    <div>
      {/* Hero Banner */}
      <CategoryHero category={category} />

      {/* Products Section */}
      <div className="container py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <ProductFilters categories={categories} />

          {/* Products */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <p className="text-muted-foreground">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
            </div>

            {products.length > 0 ? (
              <ProductGrid products={products} columns={3} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg font-medium">No products found</p>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your filters or check back soon
                </p>
              </div>
            )}

            {(page > 1 || hasNextPage) && (
              <div className="flex items-center justify-center gap-4 pt-8">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={buildCategoryPageHref(slug, resolvedSearchParams, page - 1)}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  >
                    Previous
                  </Link>
                </Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={buildCategoryPageHref(slug, resolvedSearchParams, page + 1)}
                    aria-disabled={!hasNextPage}
                    className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
                  >
                    Next
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
