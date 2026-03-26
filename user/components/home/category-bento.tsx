"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORY_IMAGES } from "@/lib/sample-images"
import type { Category } from "@/types"

gsap.registerPlugin(ScrollTrigger)

interface CategoryBentoProps {
  categories: Category[]
}

export function CategoryBento({ categories }: CategoryBentoProps) {
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
      gsap.from(".bento-tile", {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".bento-grid",
          start: "top 85%",
          once: true,
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  if (categories.length === 0) return null

  // Pad to at least 4 for the layout
  const items = categories.slice(0, 6)

  const getImage = (cat: Category) =>
    cat.image_url ||
    (CATEGORY_IMAGES as Record<string, string>)[cat.slug] ||
    null

  return (
    <section className="section" ref={sectionRef}>
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
          <div>
            <h2 data-animate className="font-serif text-3xl lg:text-5xl font-semibold tracking-tight">
              Shop by <span className="font-light italic">Category</span>
            </h2>
            <p data-animate className="mt-2 text-muted-foreground">
              Find exactly what you're looking for
            </p>
          </div>
          <Link
            href="/categories"
            data-animate
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            All Categories <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Bento Grid - asymmetric layout */}
        <div className="bento-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[180px] sm:auto-rows-[200px] lg:auto-rows-[220px]">
          {items.map((cat, index) => {
            const imageUrl = getImage(cat)
            // First item spans 2 rows, second spans 2 cols on desktop
            const spanClass = cn(
              index === 0 && "row-span-2",
              index === 1 && "lg:col-span-2",
              index === items.length - 1 && items.length > 4 && "lg:col-span-2",
            )

            return (
              <Link
                key={cat.id}
                href={`/collection?category=${cat.slug}`}
                className={cn("bento-tile group relative overflow-hidden rounded-2xl", spanClass)}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-accent/10 to-muted flex items-center justify-center">
                    <span className="text-6xl font-serif font-light text-accent/30">
                      {cat.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end">
                  <h3 className="text-white font-semibold text-lg sm:text-xl tracking-tight">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-white/60 text-xs sm:text-sm mt-1 line-clamp-1">
                      {cat.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-white/70 text-xs font-medium tracking-wide group-hover:text-white transition-colors">
                    <span>Explore</span>
                    <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>

                {/* Hover border glow */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-colors" />
              </Link>
            )
          })}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            All Categories <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
