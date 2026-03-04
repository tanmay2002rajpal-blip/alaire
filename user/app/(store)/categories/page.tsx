import type { Metadata } from "next"
import { getCategoriesWithCounts } from "@/lib/db/queries"
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
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
