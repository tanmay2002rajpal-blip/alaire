"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowRight } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

export function LifestyleBanner() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      gsap.from(".lifestyle-image", {
        scale: 1.1,
        opacity: 0,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          once: true,
        },
      })
      gsap.from(".lifestyle-content > *", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".lifestyle-content",
          start: "top 85%",
          once: true,
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[400px] lg:min-h-[500px]">
        {/* Image side */}
        <div className="relative h-[300px] sm:h-[400px] lg:h-auto overflow-hidden">
          <div className="lifestyle-image absolute inset-0">
            <Image
              src="https://res.cloudinary.com/drknn3ujj/image/upload/v1778937268/alaire/hero-slides/store-2.jpg"
              alt="ALAIRE — Comfort is not a luxury"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 lg:bg-gradient-to-l lg:from-transparent lg:to-black/5" />
        </div>

        {/* Content side */}
        <div className="lifestyle-content flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-20 bg-[#1A1A1A] text-white">
          <p className="text-accent text-xs font-medium tracking-[0.3em] uppercase">
            The Alaire Difference
          </p>
          <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
            Comfort is not
            <br />
            a <span className="font-light italic">luxury.</span>
            <br />
            It&apos;s the standard.
          </h2>
          <p className="mt-6 text-white/60 text-sm sm:text-base leading-relaxed max-w-md">
            Ultra-soft micro modal fabric. Ergonomic M-shaped support. Breathable,
            moisture-wicking, and designed to move with you — from morning to night.
            Every detail engineered for all-day comfort.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/categories"
              className="group inline-flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full text-sm font-medium transition-all hover:bg-accent hover:text-white"
            >
              Explore Collection
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-white/60 text-sm font-medium hover:text-white transition-colors px-2 py-3"
            >
              Our Story
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-semibold">100%</p>
              <p className="text-white/40 text-xs mt-1">Micro Modal</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-semibold">5</p>
              <p className="text-white/40 text-xs mt-1">Premium Colours</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-semibold">All Day</p>
              <p className="text-white/40 text-xs mt-1">Comfort</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
