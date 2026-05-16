"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"
import { getSampleProductImage } from "@/lib/sample-images"
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react"

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [isZooming, setIsZooming] = useState(false)

  const mainImageRef = useRef<HTMLDivElement>(null)
  const prevIndexRef = useRef(0)
  const thumbContainerRef = useRef<HTMLDivElement>(null)

  const displayImages =
    images && images.length > 0
      ? images.map((img) =>
          !img || img.includes("placehold") || img.includes("placeholder")
            ? getSampleProductImage(productName)
            : img
        )
      : [getSampleProductImage(productName)]

  // Reset to first image when images array changes (color switch)
  useEffect(() => {
    setSelectedIndex(0)
    prevIndexRef.current = 0
  }, [images])

  useEffect(() => {
    if (selectedIndex === prevIndexRef.current || !mainImageRef.current) return
    const direction = selectedIndex > prevIndexRef.current ? 1 : -1
    gsap.fromTo(
      mainImageRef.current,
      { opacity: 0, x: 20 * direction, scale: 0.98 },
      { opacity: 1, x: 0, scale: 1, duration: 0.3, ease: "power2.out" }
    )
    prevIndexRef.current = selectedIndex
  }, [selectedIndex])

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbContainerRef.current) return
    const activeThumb = thumbContainerRef.current.children[selectedIndex] as HTMLElement
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
    }
  }, [selectedIndex])

  const handleThumbnailClick = (index: number) => {
    if (index !== selectedIndex) setSelectedIndex(index)
  }

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }, [displayImages.length])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % displayImages.length)
  }, [displayImages.length])

  const openLightbox = () => {
    setIsLightboxOpen(true)
    document.body.style.overflow = "hidden"
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    document.body.style.overflow = ""
  }

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZooming) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const MAX_VISIBLE_THUMBS = 4

  return (
    <>
      <div className="flex flex-col-reverse gap-3 md:flex-row">
        {/* Thumbnails — max 4 visible, scrollable */}
        {displayImages.length > 1 && (
          <div className="relative flex md:flex-col gap-2 md:gap-2">
            <div
              ref={thumbContainerRef}
              className="flex gap-2 overflow-x-auto md:flex-col md:overflow-y-auto md:overflow-x-hidden md:max-h-[calc(4*5rem+3*0.5rem)] scrollbar-hide"
            >
              {displayImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => handleThumbnailClick(index)}
                  className={cn(
                    "relative w-[72px] h-[72px] md:w-20 md:h-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                    selectedIndex === index
                      ? "border-foreground"
                      : "border-transparent opacity-60 hover:opacity-100 hover:border-muted-foreground/40"
                  )}
                >
                  <Image
                    src={image}
                    alt={`${productName} - ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            {/* Overflow indicator */}
            {displayImages.length > MAX_VISIBLE_THUMBS && (
              <div className="hidden md:flex items-center justify-center text-xs text-muted-foreground pt-1">
                +{displayImages.length - MAX_VISIBLE_THUMBS} more
              </div>
            )}
          </div>
        )}

        {/* Main Image */}
        <div className="relative aspect-[4/5] max-h-[600px] flex-1 overflow-hidden rounded-lg bg-muted group">
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
                isZooming && "scale-150"
              )}
              style={
                isZooming
                  ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                  : undefined
              }
              priority
            />
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-3.5 w-3.5" />
            Click to zoom
          </div>

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

          {displayImages.length > 1 && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            <X className="h-6 w-6" />
          </button>

          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevious() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

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

          {displayImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
