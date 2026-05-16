"use client"

import { useState, useMemo, useCallback } from "react"
import { ProductGallery } from "./product-gallery"
import { ProductInfo } from "./product-info"
import type { Product, ProductVariant, ProductOption } from "@/types"

interface ProductPageClientProps {
  product: Product & {
    variants: ProductVariant[]
    options: ProductOption[]
    category?: { name: string; slug: string } | null
  }
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

export function ProductPageClient({ product }: ProductPageClientProps) {
  const colorOption = product.options?.find(
    (o) => o.name.toLowerCase() === "color"
  )
  const defaultColor = colorOption?.values[0] || ""

  const [selectedColor, setSelectedColor] = useState(defaultColor)

  const filteredImages = useMemo(() => {
    if (!selectedColor || !product.images || product.images.length <= IMAGES_PER_COLOR) {
      return product.images || []
    }
    return getImagesForColor(product.images, selectedColor)
  }, [product.images, selectedColor])

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
      />
    </div>
  )
}
