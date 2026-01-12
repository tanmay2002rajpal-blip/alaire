"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { gsap } from "gsap"
import { CATEGORY_IMAGES } from "@/lib/sample-images"
import type { Category } from "@/types"

interface CategoryHeroProps {
  category: Category
}

export function CategoryHero({ category }: CategoryHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!heroRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-content > *",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          delay: 0.2,
        }
      )
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const imageUrl =
    category.image_url ||
    CATEGORY_IMAGES[category.slug as keyof typeof CATEGORY_IMAGES] ||
    CATEGORY_IMAGES["new-arrivals"]

  return (
    <div ref={heroRef} className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src={imageUrl}
        alt={category.name}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="container pb-10 lg:pb-14">
          <div className="hero-content max-w-2xl text-white">
            {/* Breadcrumb */}
            <nav className="mb-4 flex items-center gap-2 text-sm text-white/70">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/categories" className="hover:text-white transition-colors">
                Categories
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{category.name}</span>
            </nav>

            {/* Title */}
            <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
              {category.name}
            </h1>

            {/* Description */}
            {category.description && (
              <p className="mt-4 text-lg text-white/80 md:text-xl">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
