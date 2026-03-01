import { Suspense } from "react"
import type { Metadata } from "next"
import { ProductGrid, ProductFilters } from "@/components/products"
import { getProducts, getCategories } from "@/lib/db/queries"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our collection of premium products",
}

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    price_min?: string
    price_max?: string
    sort?: string
  }>
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

  const products = await getProducts({
    category: params.category,
    priceMin: params.price_min ? parseInt(params.price_min) : undefined,
    priceMax: params.price_max ? parseInt(params.price_max) : undefined,
    sort: params.sort as "newest" | "price_asc" | "price_desc" | "name_asc" | undefined,
  })

  return <ProductGrid products={products} />
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const categories = await getCategories()

  return (
    <div className="container py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
        <p className="mt-2 text-muted-foreground">
          Explore our curated collection of premium products
        </p>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
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
