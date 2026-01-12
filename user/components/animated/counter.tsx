"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { cn } from "@/lib/utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface CounterProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
  decimals?: number
  className?: string
  separator?: string
  triggerOnScroll?: boolean
  start?: string
}

export function Counter({
  end,
  duration = 2,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
  separator = ",",
  triggerOnScroll = true,
  start = "top 85%",
}: CounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!ref.current) return

    const ctx = gsap.context(() => {
      const obj = { value: 0 }

      const animation = gsap.to(obj, {
        value: end,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          setCount(obj.value)
        },
        scrollTrigger: triggerOnScroll
          ? {
              trigger: ref.current,
              start,
              onEnter: () => {
                if (!hasAnimated.current) {
                  hasAnimated.current = true
                }
              },
            }
          : undefined,
        paused: triggerOnScroll,
      })

      if (triggerOnScroll) {
        ScrollTrigger.create({
          trigger: ref.current,
          start,
          onEnter: () => {
            if (!hasAnimated.current) {
              animation.play()
              hasAnimated.current = true
            }
          },
        })
      }

      return () => {
        animation.kill()
      }
    }, ref)

    return () => ctx.revert()
  }, [end, duration, triggerOnScroll, start])

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals)
    const parts = fixed.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return parts.join(".")
  }

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  )
}
