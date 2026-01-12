"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { NewsletterForm } from "@/components/layout/newsletter-form"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function NewsletterSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".newsletter-label",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
        }
      )

      gsap.fromTo(
        ".newsletter-title",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
          delay: 0.1,
        }
      )

      gsap.fromTo(
        ".newsletter-subtitle",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
          delay: 0.2,
        }
      )

      gsap.fromTo(
        ".newsletter-form",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
          delay: 0.3,
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-foreground py-20 text-background lg:py-28"
    >
      {/* Decorative elements */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="newsletter-label text-xs uppercase tracking-[0.2em] text-white/60">
            Newsletter
          </span>
          <h2 className="newsletter-title mt-4 font-serif text-4xl font-medium tracking-tight md:text-5xl">
            Join Our Community
          </h2>
          <p className="newsletter-subtitle mt-6 text-lg text-white/70 leading-relaxed">
            Be the first to know about new arrivals, exclusive offers, and
            curated style guides. No spam, just thoughtfully crafted updates.
          </p>
          <div className="newsletter-form mx-auto mt-10 max-w-md">
            <NewsletterForm variant="large" />
          </div>
          <p className="mt-6 text-xs text-white/50">
            By subscribing, you agree to our Privacy Policy and consent to
            receive updates from us.
          </p>
        </div>
      </div>
    </section>
  )
}
