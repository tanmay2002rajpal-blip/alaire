"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { cn } from "@/lib/utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface TextRevealProps {
  children: string
  type?: "chars" | "words" | "lines"
  delay?: number
  stagger?: number
  className?: string
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"
  triggerOnScroll?: boolean
  start?: string
}

export function TextReveal({
  children,
  type = "words",
  delay = 0,
  stagger,
  className,
  as: Component = "div",
  triggerOnScroll = true,
  start = "top 85%",
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef<HTMLSpanElement[]>([])

  // Split text based on type
  const splitText = () => {
    switch (type) {
      case "chars":
        return children.split("").map((char, i) => (
          char === " " ? (
            <span key={i} className="inline-block">&nbsp;</span>
          ) : (
            <span
              key={i}
              ref={(el) => {
                if (el) elementsRef.current[i] = el
              }}
              className="inline-block opacity-0"
              style={{ transform: "translateY(100%)" }}
            >
              {char}
            </span>
          )
        ))
      case "words":
        return children.split(" ").map((word, i, arr) => (
          <span key={i} className="inline-block overflow-hidden">
            <span
              ref={(el) => {
                if (el) elementsRef.current[i] = el
              }}
              className="inline-block opacity-0"
              style={{ transform: "translateY(100%)" }}
            >
              {word}
            </span>
            {i < arr.length - 1 && <span>&nbsp;</span>}
          </span>
        ))
      case "lines":
        return children.split("\n").map((line, i) => (
          <span key={i} className="block overflow-hidden">
            <span
              ref={(el) => {
                if (el) elementsRef.current[i] = el
              }}
              className="block opacity-0"
              style={{ transform: "translateY(100%)" }}
            >
              {line}
            </span>
          </span>
        ))
      default:
        return children
    }
  }

  useEffect(() => {
    const elements = elementsRef.current.filter(Boolean)
    if (elements.length === 0) return

    const ctx = gsap.context(() => {
      const defaultStagger = type === "chars" ? 0.03 : type === "words" ? 0.08 : 0.15
      const duration = type === "chars" ? 0.5 : type === "words" ? 0.6 : 0.8

      const animation = gsap.to(elements, {
        y: 0,
        opacity: 1,
        duration,
        stagger: stagger ?? defaultStagger,
        ease: "power3.out",
        delay,
        scrollTrigger: triggerOnScroll
          ? {
              trigger: containerRef.current,
              start,
              toggleActions: "play none none reverse",
            }
          : undefined,
      })

      return () => {
        animation.kill()
      }
    }, containerRef)

    return () => ctx.revert()
  }, [children, type, delay, stagger, triggerOnScroll, start])

  return (
    <Component ref={containerRef} className={cn("overflow-hidden", className)}>
      {splitText()}
    </Component>
  )
}
