"use client"

import { useState, useMemo, useEffect } from "react"
import { Share2, ChevronDown, Package, Sparkles, Ruler, Check } from "lucide-react"
import { AnimatedQuantity } from "@/components/ui/animated-quantity"
import { Button } from "@/components/ui/button"
import { WishlistButton } from "@/components/wishlist"
import { Separator } from "@/components/ui/separator"
import { VariantSelector } from "./variant-selector"
import { AddToCartButton } from "./add-to-cart-button"
import { formatPrice, calculateDiscount } from "@/lib/utils"
import { getSampleProductImage, DEMO_IMAGES } from "@/lib/sample-images"
import { cn } from "@/lib/utils"
import type { Product, ProductVariant, ProductOption, ProductDetail } from "@/types"

interface ProductInfoProps {
  product: Product & {
    variants: ProductVariant[]
    options: ProductOption[]
    category?: { name: string; slug: string } | null
    details?: ProductDetail[]
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

function getColorImage(
  images: string[] | undefined,
  selectedOptions: Record<string, string>,
  productName: string,
  categorySlug?: string | null
): string | undefined {
  const color = selectedOptions["Color"] || selectedOptions["color"]
  // URL-slug parsing is unreliable for Cloudinary uploads (timestamp-prefixed
  // names), so only attempt it in demo mode. In production the caller relies on
  // the variant's own image_url as the source of truth.
  if (DEMO_IMAGES && color && images && images.length > 0) {
    const slug = color.toLowerCase().replace(/\s+/g, "-")
    const match = images.find((url) => url.toLowerCase().includes(`/${slug}-`) || url.toLowerCase().includes(`/${slug}.`))
    if (match) return match
  }
  return images?.[0] || getSampleProductImage(productName, categorySlug ?? undefined) || undefined
}

export function ProductInfo({ product, onColorChange, initialColor }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1)
  const [copied, setCopied] = useState(false)
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

  // When a product has variants but the chosen combination matches none, the
  // selection is unavailable — never fall through to a cart add with an
  // undefined variantId.
  const hasVariants = !!product.variants && product.variants.length > 0
  const variantUnavailable = hasVariants && !selectedVariant

  const stockQuantity = selectedVariant?.stock_quantity ?? 0
  const inStock = hasVariants ? (selectedVariant ? stockQuantity > 0 : false) : true
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

  // Notify parent of initial color (use selected, not always first)
  useEffect(() => {
    const colorOption = product.options?.find((o) => o.name.toLowerCase() === "color")
    if (colorOption && onColorChange) {
      const selected = selectedOptions[colorOption.name] || colorOption.values[0]
      onColorChange(selected)
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

      {/* Unavailable combination */}
      {variantUnavailable && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <p className="text-sm font-medium text-destructive">This combination is unavailable</p>
        </div>
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
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-3">
        <AddToCartButton
          productId={product.id}
          slug={product.slug}
          variantId={selectedVariant?.id}
          productName={product.name}
          variantName={selectedVariant ? Object.values(selectedOptions).join(" / ") : undefined}
          price={price}
          compareAtPrice={compareAtPrice ?? undefined}
          image={selectedVariant?.image_url || getColorImage(product.images, selectedOptions, product.name, product.category?.slug)}
          maxQuantity={selectedVariant?.stock_quantity ?? 10}
          quantity={quantity}
          disabled={!inStock || !allOptionsSelected || variantUnavailable}
          className="w-full sm:flex-1"
        />
        <div className="flex gap-3">
          <WishlistButton productId={product.id} className="h-14 flex-1 sm:flex-none sm:h-12 md:h-11" />
          <Button
            variant="outline"
            className="h-14 w-14 sm:h-12 sm:w-12 md:h-11 md:w-11 shrink-0"
          onClick={async () => {
            const url = window.location.href
            if (navigator.share) {
              await navigator.share({ title: product.name, url })
            } else {
              await navigator.clipboard.writeText(url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }
          }}
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-5 w-5 sm:h-4 sm:w-4" />}
        </Button>
        </div>
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

        {/* Additional detail tabs, driven entirely by product data. Hidden when
            the product has no detail entries. */}
        {product.details
          ?.filter((detail) => detail.content && detail.content.trim())
          .map((detail) => (
            <CollapsibleSection key={detail.id} title={detail.tab_name} icon={Ruler}>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {detail.content}
              </div>
            </CollapsibleSection>
          ))}
      </div>
    </div>
  )
}
