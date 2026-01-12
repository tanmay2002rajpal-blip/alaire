import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCategoryBySlug, getProducts, getCategories } from "@/lib/supabase/queries"
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

  const categories = await getCategories()

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
          <ProductFilters categories={categories} />
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
