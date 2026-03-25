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
