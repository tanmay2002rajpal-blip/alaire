"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { getSampleProductImage } from "@/lib/sample-images"
import type { Product, ProductVariant } from "@/types"

gsap.registerPlugin(ScrollTrigger)

type ProductWithRelations = Product & {
  variants?: ProductVariant[]
  category?: { name: string; slug: string } | null
  _colorVariant?: { color: string; image: string; colorHex: string }
}

interface OnTrendPicksProps {
  products: ProductWithRelations[]
}

export function OnTrendPicks({ products }: OnTrendPicksProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    containScroll: false,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  // Scroll-progress-driven scale/opacity tween. This is the canonical Embla
  // pattern for smooth continuous animations that stay in sync with scroll.
  // We compute each slide's visual distance from center and apply scale +
  // opacity based on that distance, including proper handling of cloned
  // slides during the infinite loop (so the wrap is seamless).
  useEffect(() => {
    if (!emblaApi) return

    const snapCount = emblaApi.scrollSnapList().length
    if (snapCount === 0) return

    // Normalize: diffToTarget is a fraction of total scroll (0..1).
    // With N slides, adjacent slides are 1/N apart. Multiply by N so
    // "1 slide away" maps to 1.0 and we can use an intuitive scale factor.

    const tweenScale = () => {
      const engine = emblaApi.internalEngine()
      const scrollProgress = emblaApi.scrollProgress()

      emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
        let diffToTarget = scrollSnap - scrollProgress
        const slidesInSnap = engine.slideRegistry[snapIndex]

        slidesInSnap.forEach((slideIndex: number) => {
          // Adjust distance for cloned loop slides so the tween stays
          // continuous across the wrap point.
          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((loopItem: { target: () => number; index: number }) => {
              const target = loopItem.target()
              if (slideIndex === loopItem.index && target !== 0) {
                const sign = Math.sign(target)
                if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress)
                if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress)
              }
            })
          }

          // Normalize so 1.0 = one slide away from center
          const normalizedDiff = Math.abs(diffToTarget) * snapCount
          const clamped = Math.min(normalizedDiff, 2) // cap at 2 slides away
          const scale = 1 - clamped * 0.12            // 1.0 center → 0.76 at 2 away
          const opacity = 1 - clamped * 0.35          // 1.0 center → 0.30 at 2 away

          const slideNode = emblaApi.slideNodes()[slideIndex]
          const card = slideNode?.querySelector<HTMLElement>("[data-slide-card]")
          if (card) {
            card.style.transform = `scale(${Math.max(0.76, scale)})`
            card.style.opacity = String(Math.max(0.3, opacity))
          }
        })
      })
    }

    tweenScale()
    emblaApi.on("reInit", tweenScale)
    emblaApi.on("scroll", tweenScale)
    emblaApi.on("slideFocus", tweenScale)

    return () => {
      emblaApi.off("reInit", tweenScale)
      emblaApi.off("scroll", tweenScale)
      emblaApi.off("slideFocus", tweenScale)
    }
  }, [emblaApi])

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

  if (products.length === 0) return null

  return (
    <section className="section overflow-hidden" ref={sectionRef}>
      <div className="text-center mb-8 lg:mb-12">
        <h2 data-animate className="font-serif text-3xl lg:text-5xl font-semibold tracking-tight">
          On-Trend <span className="font-light italic">Picks</span>
        </h2>
        <p data-animate className="mt-2 text-muted-foreground">
          Explore Our Promising Line-up
        </p>
      </div>

      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {products.map((product, index) => {
              const imageUrl = product._colorVariant?.image || product.images?.[0] || getSampleProductImage(product.name, product.category?.slug)
              const isActive = index === selectedIndex
              const price = product.variants?.[0]?.price ?? product.base_price ?? 0
              const comparePrice = product.variants?.[0]?.compare_at_price
              const hasDiscount = comparePrice != null && comparePrice > price
              const productUrl = product._colorVariant
                ? `/products/${product.slug}?color=${encodeURIComponent(product._colorVariant.color)}`
                : `/products/${product.slug}`

              return (
                <div
                  key={`${product.id}-${product._colorVariant?.color || index}`}
                  className="min-w-0 flex-shrink-0 basis-[33.33%] sm:basis-[28%] lg:basis-[20%] px-1.5 sm:px-2"
                >
                  <Link
                    href={productUrl}
                    className="group block"
                  >
                    <div
                      data-slide-card
                      className={cn(
                        "relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl will-change-transform",
                        // The transform/opacity are driven by the Embla scroll
                        // tween in the parent component. Keep a short CSS
                        // transition only as a fallback for non-scroll updates.
                        "transition-[transform,opacity] duration-200 ease-out"
                      )}
                    >
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className={cn(
                          "object-cover transition-transform duration-700",
                          isActive && "group-hover:scale-105"
                        )}
                        sizes="(max-width: 640px) 70vw, (max-width: 1024px) 50vw, 40vw"
                      />

                      {/* Discount badge */}
                      {hasDiscount && isActive && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          -{Math.round(((comparePrice - price) / comparePrice) * 100)}%
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      {/* Content */}
                      <div className={cn(
                        "absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-8 transition-all duration-500",
                        isActive ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                      )}>
                        {product.category && (
                          <p className="text-white/50 text-xs font-medium tracking-[0.2em] uppercase mb-1">
                            {product.category.name}
                          </p>
                        )}
                        <h3 className="text-white font-serif text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight">
                          {product.name}
                        </h3>
                        {product._colorVariant && (
                          <p className="text-white/60 text-xs mt-0.5">{product._colorVariant.color}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-white font-medium text-lg">
                            {formatPrice(price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-white/40 line-through text-sm">
                              {formatPrice(comparePrice)}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-white/80 text-sm font-light tracking-wide group-hover:text-white transition-colors">
                          <span>Shop Now</span>
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation arrows */}
        {products.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="hidden lg:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-all hover:bg-white hover:scale-110"
              aria-label="Previous product"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={scrollNext}
              className="hidden lg:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-all hover:bg-white hover:scale-110"
              aria-label="Next product"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </>
        )}

        {/* Slide counter */}
        <div className="flex justify-center items-center gap-3 mt-6">
          <span className="text-sm font-medium tabular-nums">
            {String(selectedIndex + 1).padStart(2, "0")}
          </span>
          <div className="flex gap-1.5">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  index === selectedIndex
                    ? "w-8 bg-foreground"
                    : "w-3 bg-border hover:bg-foreground/30"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            {String(products.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  )
}
