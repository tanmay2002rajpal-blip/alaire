"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"
import { getSampleProductImage } from "@/lib/sample-images"
import { X, ZoomIn, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [isZooming, setIsZooming] = useState(false)

  const mainImageRef = useRef<HTMLDivElement>(null)
  const lightboxRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const prevIndexRef = useRef(0)

  // Use actual images, fall back to sample image if empty or placeholder
  const displayImages = images && images.length > 0 
    ? images.map((img) => (!img || img.includes("placehold") || img.includes("placeholder")) ? getSampleProductImage(productName) : img)
    : [getSampleProductImage(productName)]

  // Animate image transition
  useEffect(() => {
    if (selectedIndex === prevIndexRef.current || !mainImageRef.current) return

    const direction = selectedIndex > prevIndexRef.current ? 1 : -1

    gsap.fromTo(
      mainImageRef.current,
      {
        opacity: 0,
        x: 30 * direction,
        scale: 0.98
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out"
      }
    )

    prevIndexRef.current = selectedIndex
  }, [selectedIndex])

  // Auto-play functionality
  const startAutoPlay = useCallback(() => {
    if (displayImages.length <= 1) return

    autoPlayRef.current = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % displayImages.length)
    }, 4000) // Change image every 4 seconds
  }, [displayImages.length])

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isAutoPlay && !isLightboxOpen) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }

    return () => stopAutoPlay()
  }, [isAutoPlay, isLightboxOpen, startAutoPlay, stopAutoPlay])

  const handleThumbnailClick = (index: number) => {
    if (index !== selectedIndex) {
      setSelectedIndex(index)
      // Restart autoplay timer when manually selecting
      if (isAutoPlay) {
        stopAutoPlay()
        startAutoPlay()
      }
    }
  }

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
    if (isAutoPlay) {
      stopAutoPlay()
      startAutoPlay()
    }
  }, [displayImages.length, isAutoPlay, stopAutoPlay, startAutoPlay])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % displayImages.length)
    if (isAutoPlay) {
      stopAutoPlay()
      startAutoPlay()
    }
  }, [displayImages.length, isAutoPlay, stopAutoPlay, startAutoPlay])

  // Lightbox controls
  const openLightbox = () => {
    setIsLightboxOpen(true)
    document.body.style.overflow = "hidden"
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    document.body.style.overflow = ""
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === "Escape") closeLightbox()
        if (e.key === "ArrowLeft") handlePrevious()
        if (e.key === "ArrowRight") handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLightboxOpen, handlePrevious, handleNext])

  // Zoom on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZooming) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  return (
    <>
      <div className="flex flex-col-reverse gap-4 md:flex-row">
        {/* Thumbnails */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-x-visible md:pb-0">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  "relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg transition-all duration-200 md:w-20",
                  selectedIndex === index
                    ? "ring-2 ring-foreground ring-offset-2"
                    : "opacity-60 hover:opacity-100 hover:ring-1 hover:ring-foreground/30"
                )}
              >
                <Image
                  src={image}
                  alt={`${productName} - Image ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-muted group">
          <div
            ref={mainImageRef}
            className="relative h-full w-full cursor-zoom-in"
            onClick={openLightbox}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
          >
            <Image
              src={displayImages[selectedIndex]}
              alt={productName}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={cn(
                "object-cover transition-transform duration-300",
                isZooming && "scale-110"
              )}
              style={
                isZooming
                  ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                  : undefined
              }
              priority
            />
          </div>

          {/* Zoom hint */}
          <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-3.5 w-3.5" />
            Click to zoom
          </div>

          {/* Navigation arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevious() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/80"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/80"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Image counter & auto-play toggle */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <button
                onClick={(e) => { e.stopPropagation(); setIsAutoPlay(!isAutoPlay) }}
                className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
              >
                {isAutoPlay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {isAutoPlay ? "Pause" : "Play"}
              </button>
              <div className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {selectedIndex + 1} / {displayImages.length}
              </div>
            </div>
          )}

          {/* Progress indicators */}
          {displayImages.length > 1 && isAutoPlay && (
            <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-2">
              {displayImages.map((_, index) => (
                <div
                  key={index}
                  className="h-0.5 flex-1 rounded-full overflow-hidden bg-white/30"
                >
                  <div
                    className={cn(
                      "h-full bg-white transition-all",
                      index === selectedIndex
                        ? "animate-progress"
                        : index < selectedIndex
                        ? "w-full"
                        : "w-0"
                    )}
                    style={{
                      animation: index === selectedIndex ? "progress 4s linear" : "none"
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevious() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Next image"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Main lightbox image */}
          <div
            className="relative flex items-center justify-center w-[90vw] h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImages[selectedIndex]}
              alt={productName}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Image counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setSelectedIndex(index) }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === selectedIndex
                      ? "w-8 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes progress {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 4s linear;
        }
      `}</style>
    </>
  )
}
