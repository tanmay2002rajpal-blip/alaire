"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { cn } from "@/lib/utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface ImageRevealProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  type?: "clip" | "scale" | "parallax"
  direction?: "up" | "down" | "left" | "right"
  parallaxSpeed?: number
  className?: string
  imageClassName?: string
  priority?: boolean
  sizes?: string
}

export function ImageReveal({
  src,
  alt,
  width,
  height,
  fill = false,
  type = "scale",
  direction = "up",
  parallaxSpeed = 0.3,
  className,
  imageClassName,
  priority = false,
  sizes,
}: ImageRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !imageRef.current) return

    const container = containerRef.current
    const image = imageRef.current

    const ctx = gsap.context(() => {
      if (type === "clip") {
        // Clip-path reveal
        const clipStart =
          direction === "up"
            ? "inset(100% 0 0 0)"
            : direction === "down"
            ? "inset(0 0 100% 0)"
            : direction === "left"
            ? "inset(0 100% 0 0)"
            : "inset(0 0 0 100%)"

        gsap.fromTo(
          image,
          {
            clipPath: clipStart,
          },
          {
            clipPath: "inset(0% 0 0 0)",
            duration: 1.2,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: container,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        )
      } else if (type === "scale") {
        // Scale reveal with overflow hidden
        gsap.fromTo(
          image,
          {
            scale: 1.2,
            opacity: 0,
          },
          {
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        )
      } else if (type === "parallax") {
        // Parallax effect on scroll
        gsap.fromTo(
          image,
          {
            yPercent: -parallaxSpeed * 100,
          },
          {
            yPercent: parallaxSpeed * 100,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        )
      }
    }, containerRef)

    return () => ctx.revert()
  }, [type, direction, parallaxSpeed])

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      <div ref={imageRef} className={cn("w-full h-full", type === "scale" && "opacity-0")}>
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            className={cn("object-cover", imageClassName)}
            priority={priority}
            sizes={sizes}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={cn("w-full h-auto", imageClassName)}
            priority={priority}
            sizes={sizes}
          />
        )}
      </div>
    </div>
  )
}
