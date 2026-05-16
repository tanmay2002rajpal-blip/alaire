import type { Product, ProductVariant } from "@/types"

export type ColorExpandedProduct = Product & {
  variants?: ProductVariant[]
  category?: { name: string; slug: string } | null
  _colorVariant?: {
    color: string
    image: string
    colorHex: string
  }
}

const COLOR_SLUGS: Record<string, string[]> = {
  maroon: ["maroon"],
  teal: ["teal"],
  black: ["black"],
  "navy blue": ["navy-blue", "navy"],
  grey: ["grey", "gray"],
}

function findColorImage(images: string[], color: string): string | null {
  const colorLower = color.toLowerCase()
  const slugs = COLOR_SLUGS[colorLower] || [colorLower.replace(/\s+/g, "-")]

  for (const img of images) {
    const urlLower = img.toLowerCase()
    if (slugs.some((s) => urlLower.includes(`/${s}-front`) || urlLower.includes(`/${s}.`))) {
      return img
    }
  }
  // Fallback: any image matching the color
  for (const img of images) {
    const urlLower = img.toLowerCase()
    if (slugs.some((s) => urlLower.includes(`/${s}-`) || urlLower.includes(`/${s}.`))) {
      return img
    }
  }
  return null
}

export function expandProductsByColor<T extends Product & { variants?: ProductVariant[]; category?: { name: string; slug: string } | null }>(
  products: T[]
): ColorExpandedProduct[] {
  const result: ColorExpandedProduct[] = []

  for (const product of products) {
    if (!product.variants || product.variants.length === 0) {
      result.push(product)
      continue
    }

    // Get unique colors from variants
    const colorMap = new Map<string, { hex: string; variant: ProductVariant }>()
    for (const v of product.variants) {
      const opts = v.options as Record<string, string> | null
      const color = opts?.color || opts?.Color
      if (color && !colorMap.has(color)) {
        colorMap.set(color, {
          hex: opts?.color_hex || "",
          variant: v,
        })
      }
    }

    if (colorMap.size <= 1) {
      result.push(product)
      continue
    }

    // Create one entry per color
    for (const [color, { hex, variant }] of colorMap) {
      const colorImage = variant.image_url
        || findColorImage(product.images || [], color)
        || product.images?.[0]
        || ""

      result.push({
        ...product,
        _colorVariant: {
          color,
          image: colorImage,
          colorHex: hex,
        },
      })
    }
  }

  return result
}
