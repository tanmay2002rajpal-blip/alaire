"use client"

import { useEffect, useRef, type ReactNode, Children, isValidElement } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface StaggerRevealProps {
  children: ReactNode
  stagger?: number
  delay?: number
  duration?: number
  className?: string
  direction?: "up" | "down" | "left" | "right"
  start?: string
  distance?: number
}

export function StaggerReveal({
  children,
  stagger = 0.1,
  delay = 0,
  duration = 0.8,
  className,
  direction = "up",
  start = "top 85%",
  distance = 60,
}: StaggerRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const childRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    const elements = childRefs.current.filter(Boolean)
    if (elements.length === 0) return

    const getInitialTransform = () => {
      switch (direction) {
        case "up":
          return { y: distance }
        case "down":
          return { y: -distance }
        case "left":
          return { x: distance }
        case "right":
          return { x: -distance }
        default:
          return { y: distance }
      }
    }

    const initial = getInitialTransform()

    const ctx = gsap.context(() => {
      gsap.fromTo(
        elements,
        {
          opacity: 0,
          scale: 0.95,
          ...initial,
        },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          duration,
          stagger,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start,
            toggleActions: "play none none reverse",
          },
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [stagger, delay, duration, direction, start, distance])

  return (
    <div ref={containerRef} className={className}>
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
          return (
            <div
              ref={(el) => {
                childRefs.current[index] = el
              }}
              className="opacity-0"
            >
              {child}
            </div>
          )
        }
        return child
      })}
    </div>
  )
}
