"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ProductGrid } from "@/components/products"
import { Button } from "@/components/ui/button"
import type { Product, ProductVariant } from "@/types"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface FeaturedProductsProps {
  products: (Product & {
    variants?: ProductVariant[]
    category?: { name: string; slug: string } | null
  })[]
  title?: string
  subtitle?: string
}

export function FeaturedProducts({
  products,
  title = "New Arrivals",
  subtitle = "The latest additions to our curated collection",
}: FeaturedProductsProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !headerRef.current) return

    const ctx = gsap.context(() => {
      // Animate section header
      gsap.fromTo(
        ".section-label",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
        }
      )

      gsap.fromTo(
        ".section-title",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
          delay: 0.1,
        }
      )

      gsap.fromTo(
        ".section-subtitle",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
          delay: 0.2,
        }
      )

      gsap.fromTo(
        ".section-link",
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
          delay: 0.4,
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="featured-products"
      ref={sectionRef}
      className="py-20 lg:py-28"
    >
      <div className="container">
        {/* Section Header */}
        <div
          ref={headerRef}
          className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end"
        >
          <div className="max-w-xl">
            <span className="section-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Collection
            </span>
            <h2 className="section-title mt-3 font-serif text-4xl font-medium tracking-tight md:text-5xl">
              {title}
            </h2>
            <p className="section-subtitle mt-4 text-muted-foreground md:text-lg">
              {subtitle}
            </p>
          </div>

          <Link
            href="/products"
            className="section-link group hidden items-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground sm:flex"
          >
            View All Products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Product Grid */}
        <ProductGrid products={products} columns={4} />

        {/* Mobile View All Link */}
        <div className="mt-12 text-center sm:hidden">
          <Button asChild variant="outline" size="lg" className="min-w-[200px]">
            <Link href="/products" className="group">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
