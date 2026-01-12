"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroSectionProps {
  stats?: {
    productCount: number
    categoryCount: number
    averageRating: number
    customerCount: number
  }
}

export function HeroSection({ stats }: HeroSectionProps) {
  // Use dynamic stats or fallback to defaults
  const productCount = stats?.productCount ?? 50
  const categoryCount = stats?.categoryCount ?? 5
  const averageRating = stats?.averageRating ?? 4.9
  const customerCount = stats?.customerCount ?? 1000
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Stats counter animation on scroll
      gsap.fromTo(
        ".hero-stat",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      )

      // Animate stat numbers counting up
      const statNumbers = sectionRef.current?.querySelectorAll(".stat-number")
      statNumbers?.forEach((el) => {
        const target = el.getAttribute("data-value")
        if (!target) return

        const isDecimal = target.includes(".")
        const numericValue = parseFloat(target.replace(/[^0-9.]/g, ""))
        const suffix = target.replace(/[0-9.]/g, "")

        gsap.fromTo(
          el,
          { innerText: "0" },
          {
            innerText: numericValue,
            duration: 2,
            ease: "power2.out",
            snap: { innerText: isDecimal ? 0.1 : 1 },
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              once: true,
            },
            onUpdate: function () {
              const val = isDecimal
                ? parseFloat(el.innerHTML).toFixed(1)
                : Math.floor(parseFloat(el.innerHTML)).toLocaleString()
              el.innerHTML = val + suffix
            },
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-y border-border/30 bg-gradient-to-b from-muted/20 to-background"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-foreground/5 to-transparent blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-gradient-to-tl from-foreground/5 to-transparent blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="container relative py-16 md:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          <div className="hero-stat group text-center">
            <p className="stat-number font-serif text-4xl font-light tracking-tight md:text-5xl lg:text-6xl" data-value={`${productCount}+`}>
              0+
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Premium Products
            </p>
            <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <div className="hero-stat group text-center">
            <p className="stat-number font-serif text-4xl font-light tracking-tight md:text-5xl lg:text-6xl" data-value={`${customerCount}+`}>
              0+
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Happy Customers
            </p>
            <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <div className="hero-stat group text-center">
            <p className="stat-number font-serif text-4xl font-light tracking-tight md:text-5xl lg:text-6xl" data-value={`${categoryCount}+`}>
              0+
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Categories
            </p>
            <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <div className="hero-stat group text-center">
            <p className="stat-number font-serif text-4xl font-light tracking-tight md:text-5xl lg:text-6xl" data-value={averageRating.toFixed(1)}>
              0
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Average Rating
            </p>
            <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </section>
  )
}
