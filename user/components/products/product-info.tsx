"use client"

import { useState, useMemo } from "react"
import { Share2 } from "lucide-react"
import { AnimatedQuantity } from "@/components/ui/animated-quantity"
import { Button } from "@/components/ui/button"
import { WishlistButton } from "@/components/wishlist"
import { Separator } from "@/components/ui/separator"
import { VariantSelector } from "./variant-selector"
import { AddToCartButton } from "./add-to-cart-button"
import { formatPrice, calculateDiscount } from "@/lib/utils"
import { getSampleProductImage } from "@/lib/sample-images"
import type { Product, ProductVariant, ProductOption } from "@/types"

interface ProductInfoProps {
  product: Product & {
    variants: ProductVariant[]
    options: ProductOption[]
    category?: { name: string; slug: string } | null
  }
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    // Initialize with first available option values
    const initial: Record<string, string> = {}
    product.options?.forEach((option) => {
      if (option.values.length > 0) {
        initial[option.name] = option.values[0]
      }
    })
    return initial
  })

  // Find the selected variant based on selected options
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null

    return product.variants.find((variant) => {
      const variantOptions = variant.options as Record<string, string>
      return Object.entries(selectedOptions).every(
        ([key, value]) => (variantOptions[key] ?? variantOptions[key.toLowerCase()]) === value
      )
    })
  }, [product.variants, selectedOptions])

  const price = selectedVariant?.price ?? product.base_price ?? 0
  const compareAtPrice = selectedVariant?.compare_at_price
  const discount = compareAtPrice ? calculateDiscount(compareAtPrice, price) : null

  // Stock status
  const stockQuantity = selectedVariant?.stock_quantity ?? 0
  const inStock = selectedVariant ? stockQuantity > 0 : true
  const lowStock = stockQuantity > 0 && stockQuantity <= 5
  const allOptionsSelected =
    product.options?.length === 0 ||
    Object.keys(selectedOptions).length === product.options?.length

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }))
  }


  return (
    <div className="space-y-6">
      {/* Category */}
      {product.category && (
        <p className="text-sm text-muted-foreground">{product.category.name}</p>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-semibold">{formatPrice(price)}</span>
        {compareAtPrice && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(compareAtPrice)}
            </span>
            <span className="rounded bg-black px-2 py-0.5 text-sm font-medium text-white">
              -{discount}% OFF
            </span>
          </>
        )}
      </div>

      {/* Description */}
      {product.description && (
        <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</div>
      )}

      <Separator />

      {/* Variant Selector */}
      {product.options && product.options.length > 0 && (
        <VariantSelector
          options={product.options}
          variants={product.variants}
          selectedOptions={selectedOptions}
          onOptionChange={handleOptionChange}
        />
      )}

      {/* Stock Status */}
      {!inStock && selectedVariant && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <p className="text-sm font-medium text-destructive">Out of Stock</p>
        </div>
      )}
      {lowStock && inStock && (
        <div className="flex items-center gap-2 rounded-md bg-orange-100 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-sm font-medium text-orange-700">
            Only {stockQuantity} left in stock!
          </p>
        </div>
      )}
      {inStock && !lowStock && selectedVariant && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <p className="text-sm text-green-700">In Stock</p>
        </div>
      )}

      {/* Quantity */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Quantity</h3>
        <AnimatedQuantity
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={selectedVariant?.stock_quantity ?? 10}
          size="lg"
        />
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <AddToCartButton
          productId={product.id}
          variantId={selectedVariant?.id}
          productName={product.name}
          variantName={selectedVariant ? Object.values(selectedOptions).join(" / ") : undefined}
          price={price}
          compareAtPrice={compareAtPrice ?? undefined}
          image={product.images?.[0] || getSampleProductImage(product.name, product.category?.slug)}
          maxQuantity={selectedVariant?.stock_quantity ?? 10}
          quantity={quantity}
          disabled={!inStock || !allOptionsSelected}
          className="flex-1"
        />
        <WishlistButton productId={product.id} className="h-14 sm:h-12 md:h-11" />
        <Button variant="outline" size="icon" className="h-14 w-14 sm:h-12 sm:w-12">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* SKU */}
      {selectedVariant?.sku && (
        <p className="text-xs text-muted-foreground">SKU: {selectedVariant.sku}</p>
      )}
    </div>
  )
}
