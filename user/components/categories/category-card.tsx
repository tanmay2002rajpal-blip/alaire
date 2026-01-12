"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { gsap } from "gsap"
import { CATEGORY_IMAGES } from "@/lib/sample-images"
import type { Category } from "@/types"

interface CategoryCardProps {
  category: Category & { product_count?: number }
}

export function CategoryCard({ category }: CategoryCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)

  const handleMouseEnter = () => {
    if (!cardRef.current) return
    const img = cardRef.current.querySelector("img")
    if (img) {
      gsap.to(img, { scale: 1.08, duration: 0.6, ease: "power3.out" })
    }
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    const img = cardRef.current.querySelector("img")
    if (img) {
      gsap.to(img, { scale: 1, duration: 0.6, ease: "power3.out" })
    }
  }

  const imageUrl =
    category.image_url ||
    CATEGORY_IMAGES[category.slug as keyof typeof CATEGORY_IMAGES] ||
    CATEGORY_IMAGES["new-arrivals"]

  return (
    <Link
      ref={cardRef}
      href={`/categories/${category.slug}`}
      className="category-card group relative aspect-[4/3] overflow-hidden bg-muted"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={imageUrl}
        alt={category.name}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-out"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-500" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-serif text-xl font-medium text-white lg:text-2xl">
              {category.name}
            </h3>
            {category.product_count !== undefined && (
              <p className="mt-1 text-sm text-white/70">
                {category.product_count} {category.product_count === 1 ? "product" : "products"}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-foreground">
            <ArrowUpRight className="h-5 w-5 text-white group-hover:text-foreground" />
          </div>
        </div>
      </div>
    </Link>
  )
}
