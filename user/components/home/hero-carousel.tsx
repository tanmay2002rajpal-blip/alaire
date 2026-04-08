"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"

// MARKAWARE-inspired minimal luxury aesthetic


export interface CarouselSlide {
  id: string | number
  image: string
  title: string
  subtitle?: string | null
  description?: string | null
  cta: { text: string; href: string }
  align?: "left" | "center" | "right"
}

interface HeroCarouselProps {
  slides: CarouselSlide[]
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const progressRef = useRef<HTMLDivElement>(null)
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)


  // Animate the inner content of a slide (image/title/subtitle/CTA only).
  // Slide-level opacity/zIndex is handled by goToSlide so that a true
  // simultaneous crossfade works — the old approach reset all slides to
  // opacity 0 here, which fought with the crossfade tweens below.
  const animateSlideIn = useCallback((index: number) => {
    const slide = slideRefs.current[index]
    if (!slide) return

    const tl = gsap.timeline()

    // Image - subtle Ken Burns effect
    tl.fromTo(
      slide.querySelector(".slide-image"),
      { scale: 1.08 },
      { scale: 1, duration: 8, ease: "none" },
      0
    )

    // Overlay fade - very subtle
    tl.fromTo(
      slide.querySelector(".slide-overlay"),
      { opacity: 0.6 },
      { opacity: 1, duration: 1.5, ease: "power1.out" },
      0
    )

    // Title - elegant fade up
    tl.fromTo(
      slide.querySelector(".slide-title"),
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.4, ease: "power2.out" },
      0.3
    )

    // Subtitle - delayed reveal
    tl.fromTo(
      slide.querySelector(".slide-subtitle"),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power2.out" },
      0.6
    )

    // CTA - final element
    tl.fromTo(
      slide.querySelector(".slide-cta"),
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: "power2.out" },
      1
    )

    return tl
  }, [])

  // Go to a specific slide — true simultaneous crossfade.
  // The previous implementation faded the current slide to 0 FIRST and only
  // started the next slide's animation in onComplete, leaving ~1s of dark
  // background between slides. Now the incoming slide is placed above the
  // current one (z-index 2) and fades in while the old one fades out.
  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return
    setIsAnimating(true)

    const currentSlideEl = slideRefs.current[currentSlide]
    const nextSlideEl = slideRefs.current[index]
    if (!currentSlideEl || !nextSlideEl) {
      setIsAnimating(false)
      return
    }

    // Prepare next slide above current, starting invisible
    gsap.set(nextSlideEl, { opacity: 0, zIndex: 2 })

    // Kick off the content animations for the incoming slide
    animateSlideIn(index)

    // Fade the incoming slide up while the old one fades out — both happen
    // at the same time, so the viewer always sees a slide on screen.
    gsap.to(nextSlideEl, {
      opacity: 1,
      duration: 1.2,
      ease: "power2.inOut",
    })

    gsap.to(currentSlideEl, {
      opacity: 0,
      duration: 1.2,
      ease: "power2.inOut",
      onComplete: () => {
        // Normalize z-indexes once the crossfade completes
        gsap.set(currentSlideEl, { zIndex: 0 })
        gsap.set(nextSlideEl, { zIndex: 1 })
        setCurrentSlide(index)
        setIsAnimating(false)
      },
    })
  }, [currentSlide, isAnimating, animateSlideIn])

  // Next/prev controls
  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length)
  }, [currentSlide, slides.length, goToSlide])

  // Autoplay
  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      if (!isAnimating) {
        nextSlide()
      }
    }, 7000)

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
      }
    }
  }, [nextSlide, isAnimating])

  // Progress bar animation
  useEffect(() => {
    if (!progressRef.current) return

    gsap.fromTo(
      progressRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 7,
        ease: "none",
        transformOrigin: "left center",
      }
    )
  }, [currentSlide])

  // Initial animation
  useEffect(() => {
    animateSlideIn(0)
  }, [animateSlideIn])

  return (
    <section
      ref={containerRef}
      className="relative h-[70vh] md:h-screen w-full overflow-hidden bg-[#0A0A0A]"
    >
      {/* Subtle grain texture */}
      <div
        className="pointer-events-none absolute inset-0 z-30 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          ref={(el) => { slideRefs.current[index] = el }}
          className={cn(
            "absolute inset-0",
            index === 0 ? "opacity-100 z-[1]" : "opacity-0 z-0"
          )}
        >
          {/* Background Image - subtle treatment */}
          <div className="slide-image absolute inset-0">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover brightness-[0.6] contrast-[1.05] saturate-[0.9]"
            />
          </div>

          {/* Refined gradient overlay */}
          <div className="slide-overlay absolute inset-0">
            {/* Subtle vignette - all edges */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            {/* Bottom gradient for content legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>

          {/* Content - minimal, bottom-aligned */}
          <div className="relative z-10 flex h-full items-start pt-24 md:items-end md:pt-0 md:pb-40">
            <div className="container">
              <div className="max-w-xl">
                {/* Title - refined typography */}
                <h1 className="slide-title">
                  <span className="block font-light text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] tracking-[-0.02em] text-white">
                    {slide.title}
                  </span>
                </h1>

                {/* Subtitle - understated */}
                {slide.subtitle && (
                  <p className="slide-subtitle mt-4 text-base font-light tracking-[0.15em] uppercase text-white/50 md:text-lg">
                    {slide.subtitle}
                  </p>
                )}

                {/* CTA - minimal link style */}
                <div className="slide-cta mt-8">
                  <Link
                    href={slide.cta.href}
                    className="group inline-flex items-center gap-3 text-sm font-light tracking-[0.2em] uppercase text-white/80 transition-colors hover:text-white"
                  >
                    {slide.cta.text}
                    <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation - ultra minimal side indicators */}
      <div className="absolute right-6 top-1/2 z-20 -translate-y-1/2 hidden md:flex flex-col gap-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isAnimating}
            className="group relative flex items-center"
            aria-label={`Go to slide ${index + 1}`}
          >
            <span
              className={cn(
                "h-px transition-all duration-700 ease-out",
                index === currentSlide
                  ? "w-12 bg-white"
                  : "w-6 bg-white/30 group-hover:w-8 group-hover:bg-white/50"
              )}
            />
            {index === currentSlide && (
              <div
                ref={progressRef}
                className="absolute inset-y-0 left-0 h-px bg-white/50 origin-left"
                style={{ width: '48px' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Mobile dots */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:hidden">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isAnimating}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              index === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/40"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide counter - bottom right */}
      <div className="absolute bottom-8 right-6 z-20 hidden md:block">
        <span className="font-light text-xs tracking-[0.3em] text-white/40">
          {String(currentSlide + 1).padStart(2, "0")}
          <span className="mx-2">/</span>
          {String(slides.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  )
}
