"use client"

import React, { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import type { EmblaOptionsType } from "embla-carousel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmblaCarouselProps {
  children: React.ReactNode
  options?: EmblaOptionsType
  showArrows?: boolean
  showDots?: boolean
  className?: string
  slideClassName?: string
  arrowClassName?: string
  "aria-label"?: string
}

export function EmblaCarousel({
  children,
  options = { loop: true, align: "start" },
  showArrows = true,
  showDots = true,
  className,
  slideClassName,
  arrowClassName,
  "aria-label": ariaLabel,
}: EmblaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const slideCount = React.Children.count(children)
  const hideControls = slideCount <= 1

  return (
    <div
      className={cn("relative", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {React.Children.map(children, (child, index) => (
            <div
              key={index}
              className={cn("min-w-0 flex-shrink-0", slideClassName)}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && !hideControls && (
        <>
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -left-4 lg:-left-5 z-10",
              "flex h-10 w-10 items-center justify-center rounded-full",
              "border border-border bg-background/80 backdrop-blur-sm",
              "transition-all hover:bg-accent hover:text-white",
              "disabled:opacity-0 disabled:pointer-events-none",
              arrowClassName
            )}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -right-4 lg:-right-5 z-10",
              "flex h-10 w-10 items-center justify-center rounded-full",
              "border border-border bg-background/80 backdrop-blur-sm",
              "transition-all hover:bg-accent hover:text-white",
              "disabled:opacity-0 disabled:pointer-events-none",
              arrowClassName
            )}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {showDots && !hideControls && (
        <div className="flex justify-center gap-2 mt-6">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                index === selectedIndex
                  ? "bg-accent w-6"
                  : "bg-border hover:bg-accent/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
