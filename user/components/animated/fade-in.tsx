"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { cn } from "@/lib/utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface FadeInProps {
  children: ReactNode
  direction?: "up" | "down" | "left" | "right" | "none"
  delay?: number
  duration?: number
  className?: string
  triggerOnScroll?: boolean
  start?: string
  distance?: number
  once?: boolean
}

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.8,
  className,
  triggerOnScroll = true,
  start = "top 85%",
  distance = 40,
  once = true,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const element = ref.current

    const getInitialTransform = () => {
      switch (direction) {
        case "up":
          return { y: distance, x: 0 }
        case "down":
          return { y: -distance, x: 0 }
        case "left":
          return { x: distance, y: 0 }
        case "right":
          return { x: -distance, y: 0 }
        default:
          return { x: 0, y: 0 }
      }
    }

    const initial = getInitialTransform()

    const ctx = gsap.context(() => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          ...initial,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: triggerOnScroll
            ? {
                trigger: element,
                start,
                toggleActions: once ? "play none none none" : "play none none reverse",
              }
            : undefined,
        }
      )
    }, ref)

    return () => ctx.revert()
  }, [direction, delay, duration, triggerOnScroll, start, distance, once])

  return (
    <div ref={ref} className={cn("opacity-0", className)}>
      {children}
    </div>
  )
}
