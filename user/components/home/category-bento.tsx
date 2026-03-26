"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowRight } from "lucide-react"
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
      gsap.from(".cat-card", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".cat-strip",
          start: "top 85%",
          once: true,
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  if (categories.length === 0) return null

  const getImage = (cat: Category) =>
    cat.image_url ||
    (CATEGORY_IMAGES as Record<string, string>)[cat.slug] ||
    null

  return (
    <section className="section" ref={sectionRef}>
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-6 lg:mb-10">
          <div>
            <h2 data-animate className="font-serif text-3xl lg:text-5xl font-semibold tracking-tight">
              Shop by <span className="font-light italic">Category</span>
            </h2>
            <p data-animate className="mt-2 text-muted-foreground">
              Find exactly what you&apos;re looking for
            </p>
          </div>
          <Link
            href="/categories"
            data-animate
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors shrink-0"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Horizontal scroll on mobile, centered grid on desktop */}
      <div className="cat-strip flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory px-[max(1rem,calc((100vw-1400px)/2+1rem))] pb-2 lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:overflow-visible lg:snap-none lg:px-[max(1rem,calc((100vw-1400px)/2+1rem))]">
        {categories.map((cat) => {
          const imageUrl = getImage(cat)

          return (
            <Link
              key={cat.id}
              href={`/collection?category=${cat.slug}`}
              className="cat-card group snap-start shrink-0 w-[140px] sm:w-[180px] lg:w-auto"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-muted to-accent/5 flex items-center justify-center">
                    <span className="text-5xl font-serif font-light text-accent/30">
                      {cat.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Name */}
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <h3 className="text-white font-semibold text-sm sm:text-base tracking-tight text-center">
                    {cat.name}
                  </h3>
                </div>

                {/* Hover ring */}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-white/30 transition-all" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="container mt-5 text-center sm:hidden">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          All Categories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
