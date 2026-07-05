"use client"

import { useState, useMemo, useCallback } from "react"
import { ProductGallery } from "./product-gallery"
import { ProductInfo } from "./product-info"
import { DEMO_IMAGES } from "@/lib/sample-images"
import type { Product, ProductVariant, ProductOption, ProductDetail } from "@/types"

interface ProductPageClientProps {
  product: Product & {
    variants: ProductVariant[]
    options: ProductOption[]
    category?: { name: string; slug: string } | null
    details?: ProductDetail[]
  }
  initialColor?: string
}

const IMAGES_PER_COLOR = 4

const COLOR_SLUGS: Record<string, string[]> = {
  maroon: ["maroon"],
  teal: ["teal"],
  black: ["black"],
  "navy blue": ["navy-blue", "navy"],
  grey: ["grey", "gray"],
}

function getImagesForColor(allImages: string[], color: string): string[] {
  const colorLower = color.toLowerCase()
  const slugs = COLOR_SLUGS[colorLower] || [colorLower.replace(/\s+/g, "-")]

  const filtered = allImages.filter((url) => {
    const urlLower = url.toLowerCase()
    return slugs.some((slug) => urlLower.includes(`/${slug}-`) || urlLower.includes(`/${slug}.`))
  })

  if (filtered.length > 0) return filtered

  // Fallback: group by position (every IMAGES_PER_COLOR images = 1 color)
  // Find the color's index in the options
  return allImages.slice(0, IMAGES_PER_COLOR)
}

export function ProductPageClient({ product, initialColor }: ProductPageClientProps) {
  const colorOption = product.options?.find(
    (o) => o.name.toLowerCase() === "color"
  )
  const defaultColor = initialColor && colorOption?.values.includes(initialColor)
    ? initialColor
    : colorOption?.values[0] || ""

  const [selectedColor, setSelectedColor] = useState(defaultColor)

  const filteredImages = useMemo(() => {
    if (!selectedColor) return product.images || []

    // Source of truth for a color's image: the matching variant's image_url.
    // URL-slug parsing only works for demo assets whose filenames embed the
    // color name — real Cloudinary uploads are timestamp-prefixed, so we only
    // fall back to slug parsing in demo mode.
    if (DEMO_IMAGES) {
      if (product.images && product.images.length > IMAGES_PER_COLOR) {
        return getImagesForColor(product.images, selectedColor)
      }
      return product.images || []
    }

    const colorVariant = product.variants?.find((v) => {
      const opts = v.options as Record<string, string> | null
      return (opts?.color || opts?.Color) === selectedColor
    })
    if (colorVariant?.image_url) {
      const rest = (product.images || []).filter((img) => img !== colorVariant.image_url)
      return [colorVariant.image_url, ...rest]
    }
    return product.images || []
  }, [product.images, product.variants, selectedColor])

  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color)
  }, [])

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ProductGallery
        images={filteredImages}
        productName={product.name}
      />
      <ProductInfo
        product={product}
        onColorChange={handleColorChange}
        initialColor={defaultColor}
      />
    </div>
  )
}
