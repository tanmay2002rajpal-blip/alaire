"use client"

import { useState, useMemo, useEffect } from "react"
import { Share2, ChevronDown, Package, Sparkles, Ruler, ShieldCheck } from "lucide-react"
import { AnimatedQuantity } from "@/components/ui/animated-quantity"
import { Button } from "@/components/ui/button"
import { WishlistButton } from "@/components/wishlist"
import { Separator } from "@/components/ui/separator"
import { VariantSelector } from "./variant-selector"
import { AddToCartButton } from "./add-to-cart-button"
import { formatPrice, calculateDiscount } from "@/lib/utils"
import { getSampleProductImage } from "@/lib/sample-images"
import { cn } from "@/lib/utils"
import type { Product, ProductVariant, ProductOption } from "@/types"

interface ProductInfoProps {
  product: Product & {
    variants: ProductVariant[]
    options: ProductOption[]
    category?: { name: string; slug: string } | null
  }
  onColorChange?: (color: string) => void
  initialColor?: string
}

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: React.ElementType
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4" />
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[600px] pb-4" : "max-h-0"
        )}
      >
        {children}
      </div>
    </div>
  )
}

function parseDescription(desc: string) {
  const lines = desc.split("\n").map((l) => l.trim()).filter(Boolean)

  let mainDescription = ""
  const features: string[] = []
  let inFeatures = false

  for (const line of lines) {
    if (line.toLowerCase().startsWith("features") && line.includes(":")) {
      inFeatures = true
      continue
    }
    if (inFeatures || line.startsWith("•") || line.startsWith("*") || line.startsWith("-")) {
      const clean = line.replace(/^[•*\-]\s*/, "").trim()
      if (clean) features.push(clean)
      inFeatures = true
    } else if (
      line.toLowerCase().startsWith("designed for") ||
      line.toLowerCase().startsWith("experience") ||
      line.toLowerCase().startsWith("the specially") ||
      line.toLowerCase().startsWith("made from") ||
      !inFeatures
    ) {
      if (line === lines[0] && line.includes("ALAIRE")) continue
      if (mainDescription) mainDescription += "\n\n"
      mainDescription += line
    }
  }

  return { mainDescription, features }
}

export function ProductInfo({ product, onColorChange, initialColor }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    product.options?.forEach((option) => {
      if (option.name.toLowerCase() === "color" && initialColor && option.values.includes(initialColor)) {
        initial[option.name] = initialColor
      } else if (option.values.length > 0) {
        initial[option.name] = option.values[0]
      }
    })
    return initial
  })

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

  const stockQuantity = selectedVariant?.stock_quantity ?? 0
  const inStock = selectedVariant ? stockQuantity > 0 : true
  const lowStock = stockQuantity > 0 && stockQuantity <= 5
  const allOptionsSelected =
    product.options?.length === 0 ||
    Object.keys(selectedOptions).length === product.options?.length

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }))
    if (optionName.toLowerCase() === "color" && onColorChange) {
      onColorChange(value)
    }
  }

  // Notify parent of initial color
  useEffect(() => {
    const colorOption = product.options?.find((o) => o.name.toLowerCase() === "color")
    if (colorOption && colorOption.values.length > 0 && onColorChange) {
      onColorChange(colorOption.values[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { mainDescription, features } = useMemo(
    () => parseDescription(product.description || ""),
    [product.description]
  )

  return (
    <div className="space-y-5">
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

      {/* Short tagline */}
      <p className="text-sm text-muted-foreground">
        Ultra-soft micro modal fabric with M-shaped ergonomic support. Comfort that lasts all day.
      </p>

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
        <Button variant="outline" size="icon" className="h-14 w-14 sm:h-12 sm:w-12 md:h-11 md:w-11">
          <Share2 className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* SKU */}
      {selectedVariant?.sku && (
        <p className="text-xs text-muted-foreground">SKU: {selectedVariant.sku}</p>
      )}

      <Separator />

      {/* Collapsible Product Sections */}
      <div className="border-t">
        <CollapsibleSection title="Product Description" icon={Package} defaultOpen>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {mainDescription}
          </p>
        </CollapsibleSection>

        {features.length > 0 && (
          <CollapsibleSection title="Features" icon={Sparkles} defaultOpen>
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
                  {feature}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        <CollapsibleSection title="Product Details" icon={Ruler}>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-muted-foreground">Material</div>
            <div className="font-medium">Micro Modal</div>
            <div className="text-muted-foreground">Fit</div>
            <div className="font-medium">Modern body-hugging fit</div>
            <div className="text-muted-foreground">Waistband</div>
            <div className="font-medium">Soft stretch elastic with ALAIRE branding</div>
            <div className="text-muted-foreground">Support</div>
            <div className="font-medium">Ergonomic M-shaped pouch</div>
            <div className="text-muted-foreground">Pattern</div>
            <div className="font-medium">Solid</div>
            <div className="text-muted-foreground">Pack of</div>
            <div className="font-medium">1</div>
            <div className="text-muted-foreground">Ideal For</div>
            <div className="font-medium">Men</div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Care Instructions" icon={ShieldCheck}>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
              Machine wash cold with similar colours
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
              Do not bleach
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
              Tumble dry low
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
              Do not iron on print
            </li>
          </ul>
        </CollapsibleSection>
      </div>
    </div>
  )
}
