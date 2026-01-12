"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { cn } from "@/lib/utils"
import { ProductCard } from "./product-card"
import type { Product, ProductVariant } from "@/types"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface ProductGridProps {
  products: (Product & {
    variants?: ProductVariant[]
    category?: { name: string; slug: string } | null
  })[]
  columns?: 2 | 3 | 4
  className?: string
  animate?: boolean
}

export function ProductGrid({
  products,
  columns = 4,
  className,
  animate = true,
}: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }

  useEffect(() => {
    if (!animate || !gridRef.current) return

    const ctx = gsap.context(() => {
      const cards = gridRef.current!.querySelectorAll(".product-card")

      // Set initial state
      gsap.set(cards, {
        y: 60,
        opacity: 0,
      })

      // Use ScrollTrigger.batch for performance
      ScrollTrigger.batch(cards, {
        onEnter: (batch) => {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            overwrite: true,
          })
        },
        start: "top 90%",
        once: true,
      })
    }, gridRef)

    return () => ctx.revert()
  }, [animate, products])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mx-auto max-w-md">
          <p className="font-serif text-2xl font-medium">No products found</p>
          <p className="mt-3 text-muted-foreground">
            Try adjusting your filters or search terms to discover our collection
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={gridRef}
      className={cn(
        "grid gap-x-6 gap-y-10 lg:gap-x-8 lg:gap-y-12",
        gridCols[columns],
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
