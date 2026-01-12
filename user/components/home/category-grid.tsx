"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { CATEGORY_IMAGES } from "@/lib/sample-images"
import type { Category } from "@/types"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface CategoryGridProps {
  categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !headerRef.current) return

    const ctx = gsap.context(() => {
      // Animate section header
      gsap.fromTo(
        ".category-label",
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
        ".category-title",
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
        ".category-subtitle",
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

      // Animate category cards
      const cards = sectionRef.current!.querySelectorAll(".category-card")
      gsap.set(cards, { y: 60, opacity: 0 })

      ScrollTrigger.batch(cards, {
        onEnter: (batch) => {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            overwrite: true,
          })
        },
        start: "top 90%",
        once: true,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const img = e.currentTarget.querySelector("img")
    if (img) {
      gsap.to(img, { scale: 1.08, duration: 0.6, ease: "power3.out" })
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const img = e.currentTarget.querySelector("img")
    if (img) {
      gsap.to(img, { scale: 1, duration: 0.6, ease: "power3.out" })
    }
  }

  return (
    <section ref={sectionRef} className="bg-muted/30 py-20 lg:py-28">
      <div className="container">
        {/* Section Header */}
        <div
          ref={headerRef}
          className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end"
        >
          <div className="max-w-xl">
            <span className="category-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Categories
            </span>
            <h2 className="category-title mt-3 font-serif text-4xl font-medium tracking-tight md:text-5xl">
              Shop by Category
            </h2>
            <p className="category-subtitle mt-4 text-muted-foreground md:text-lg">
              Browse our carefully curated collections
            </p>
          </div>

          <Link
            href="/categories"
            className="group hidden items-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground sm:flex"
          >
            View All Categories
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {categories.slice(0, 3).map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="category-card group relative aspect-[4/3] overflow-hidden bg-muted"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Image
                src={category.image_url || CATEGORY_IMAGES[category.slug as keyof typeof CATEGORY_IMAGES] || CATEGORY_IMAGES["new-arrivals"]}
                alt={category.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out"
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-500" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white lg:p-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-medium lg:text-3xl">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mt-2 max-w-[200px] text-sm text-white/70 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-foreground">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Additional categories list on mobile */}
        {categories.length > 3 && (
          <div className="mt-6 grid gap-3 sm:hidden">
            {categories.slice(3, 6).map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group flex items-center justify-between border-b border-border/50 py-4 transition-colors"
              >
                <span className="font-medium">{category.name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
