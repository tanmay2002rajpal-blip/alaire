"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowRight, Star } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { getSampleProductImage } from "@/lib/sample-images"
import type { Product, ProductVariant } from "@/types"

gsap.registerPlugin(ScrollTrigger)

type ProductWithRelations = Product & {
  variants?: ProductVariant[]
  category?: { name: string; slug: string } | null
  _colorVariant?: { color: string; image: string; colorHex: string }
}

interface BestSellersProps {
  products: ProductWithRelations[]
}

export function BestSellers({ products }: BestSellersProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const isMobile = window.innerWidth < 768

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
      if (!isMobile) {
        gsap.from(".rank-card", {
          x: 60,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".rank-scroll",
            start: "top 85%",
            once: true,
          },
        })
      }
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  if (products.length === 0) return null

  const topProducts = products.slice(0, 6)

  return (
    <section className="py-16 lg:py-24 bg-[#1A1A1A] text-white overflow-hidden" ref={sectionRef}>
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
          <div>
            <div data-animate className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-accent text-xs font-medium tracking-[0.2em] uppercase">
                Customer Favorites
              </span>
            </div>
            <h2 data-animate className="font-serif text-3xl lg:text-5xl font-semibold tracking-tight">
              Best <span className="font-light italic">Sellers</span>
            </h2>
            <p data-animate className="mt-2 text-white/50">
              The most loved pieces from our collection
            </p>
          </div>
          <Link
            href="/products"
            data-animate
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:text-white transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Horizontal scroll with snap */}
      <div className="rank-scroll flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory px-[max(1rem,calc((100vw-1400px)/2+1rem))]  pb-4">
        {topProducts.map((product, index) => {
          const imageUrl = product._colorVariant?.image || product.images?.[0] || getSampleProductImage(product.name, product.category?.slug)
          const price = product.variants?.[0]?.price ?? product.base_price ?? 0
          const comparePrice = product.variants?.[0]?.compare_at_price
          const hasDiscount = comparePrice != null && comparePrice > price
          const productUrl = product._colorVariant
            ? `/products/${product.slug}?color=${encodeURIComponent(product._colorVariant.color)}`
            : `/products/${product.slug}`

          return (
            <Link
              key={`${product.id}-${product._colorVariant?.color || index}`}
              href={productUrl}
              className="rank-card group snap-start shrink-0 w-[280px] sm:w-[320px] lg:w-[360px]"
            >
              <div className="relative rounded-2xl overflow-hidden transition-all">
                {/* Product image */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="360px"
                  />

                  {/* Large rank number */}
                  <div className="absolute top-3 left-4 flex items-baseline gap-0.5">
                    <span className="text-6xl sm:text-7xl font-serif font-bold text-white/15 leading-none">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Discount badge */}
                  {hasDiscount && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      -{Math.round(((comparePrice - price) / comparePrice) * 100)}%
                    </div>
                  )}

                  {/* Bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
                </div>

                {/* Product info */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-accent text-[10px] font-bold tracking-widest uppercase">
                      #{index + 1} Best Seller
                    </span>
                  </div>
                  {product.category && (
                    <p className="text-white/40 text-xs tracking-wide">
                      {product.category.name}
                    </p>
                  )}
                  <h3 className="mt-1 text-white font-medium text-base sm:text-lg tracking-tight group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  {product._colorVariant && (
                    <p className="text-white/50 text-xs mt-0.5">{product._colorVariant.color}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-white font-semibold">
                      {formatPrice(price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-white/30 line-through text-sm">
                        {formatPrice(comparePrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="container mt-6 text-center sm:hidden">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-white transition-colors"
        >
          View All Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
