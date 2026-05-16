"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { EmblaCarousel } from "@/components/ui/embla-carousel"
import { ProductCard } from "@/components/products/product-card"
import { CategoryTabs } from "./category-tabs"
import type { Product, ProductVariant, Category } from "@/types"

gsap.registerPlugin(ScrollTrigger)

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
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      gsap.from("[data-animate]", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          once: true,
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products
    return products.filter((p) => p.category_id === activeCategory)
  }, [products, activeCategory])

  if (products.length === 0) return null

  return (
    <section className="section overflow-hidden" ref={sectionRef}>
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
          <div>
            <h2 data-animate className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
              New Arrivals
            </h2>
            <p data-animate className="mt-2 text-muted-foreground">
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
              href="/products"
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
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
