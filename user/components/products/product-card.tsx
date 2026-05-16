"use client"

import { useRef, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Eye, ShoppingBag } from "lucide-react"
import { gsap } from "gsap"
import { cn, formatPrice, calculateDiscount } from "@/lib/utils"
import { getSampleProductImage } from "@/lib/sample-images"
import { Button } from "@/components/ui/button"
import { useWishlist, useCart } from "@/hooks"
import type { Product, ProductVariant } from "@/types"

interface ProductCardProps {
  product: Product & {
    variants?: ProductVariant[]
    category?: { name: string; slug: string } | null
    _colorVariant?: {
      color: string
      image: string
      colorHex: string
    }
  }
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addItem } = useCart()

  // Get the first variant for pricing, or use base_price
  const firstVariant = product.variants?.[0]
  const price = firstVariant?.price ?? product.base_price ?? 0
  const compareAtPrice = firstVariant?.compare_at_price
  const discount = compareAtPrice ? calculateDiscount(compareAtPrice, price) : null

  // Calculate total stock across all variants
  const totalStock = product.variants?.reduce(
    (sum, v) => sum + (v.stock_quantity ?? 0),
    0
  ) ?? 0
  const isOutOfStock = product.variants && product.variants.length > 0 && totalStock === 0
  const isLowStock = totalStock > 0 && totalStock <= 5

  // Get image — prefer color variant image if available
  const imageUrl = useMemo(() => {
    if (product._colorVariant?.image) return product._colorVariant.image
    const dbImage = product.images?.[0]
    if (!dbImage || dbImage.includes("placehold") || dbImage.includes("placeholder")) {
      return getSampleProductImage(product.name, product.category?.slug)
    }
    return dbImage
  }, [product.images, product.name, product.category?.slug, product._colorVariant])

  const isWishlisted = isInWishlist(product.id)

  const productUrl = product._colorVariant
    ? `/products/${product.slug}?color=${encodeURIComponent(product._colorVariant.color)}`
    : `/products/${product.slug}`

  // Get variant count for display
  const variantCount = product.variants?.length ?? 0

  // Check if product is new (created in last 7 days) using stable reference time
  const [mountTime] = useState(() => Date.now())
  const isNew = useMemo(() => {
    if (!product.created_at) return false
    const sevenDaysAgo = mountTime - 7 * 24 * 60 * 60 * 1000
    return new Date(product.created_at).getTime() > sevenDaysAgo
  }, [product.created_at, mountTime])

  const handleMouseEnter = () => {
    if (!imageRef.current) return
    gsap.to(imageRef.current.querySelector("img"), {
      scale: 1.08,
      duration: 0.6,
      ease: "power3.out",
    })
  }

  const handleMouseLeave = () => {
    if (!imageRef.current) return
    gsap.to(imageRef.current.querySelector("img"), {
      scale: 1,
      duration: 0.6,
      ease: "power3.out",
    })
  }

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      variantId: firstVariant?.id,
      name: product.name,
      variantName: firstVariant?.name,
      price: price,
      compareAtPrice: compareAtPrice ?? undefined,
      quantity: 1,
      image: imageUrl,
      maxQuantity: firstVariant?.stock_quantity ?? 10,
    })
  }

  return (
    <article
      ref={cardRef}
      className={cn(
        "product-card group relative",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container */}
      <Link href={productUrl} className="block">
        <div
          ref={imageRef}
          className="relative aspect-[3/4] overflow-hidden bg-muted/50"
        >
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Discount Badge */}
          {discount && (
            <div className="absolute left-4 top-4 bg-foreground px-3 py-1.5 text-xs font-medium tracking-wide text-background">
              -{discount}%
            </div>
          )}

          {/* New Badge - show for products created in last 7 days */}
          {!discount && !isOutOfStock && isNew && (
            <div className="absolute left-4 top-4 border border-foreground/20 bg-background/90 px-3 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm">
              New
            </div>
          )}

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div className="absolute left-4 top-4 bg-destructive px-3 py-1.5 text-xs font-medium tracking-wide text-destructive-foreground">
              Sold Out
            </div>
          )}

          {/* Low Stock Badge */}
          {isLowStock && !isOutOfStock && (
            <div className="absolute left-4 top-4 bg-orange-500 px-3 py-1.5 text-xs font-medium tracking-wide text-white">
              Only {totalStock} left
            </div>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" />
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-center gap-2 opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-4 transition-all duration-500 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
            <Button
              size="sm"
              variant="secondary"
              className="h-10 flex-1 bg-background/95 backdrop-blur-sm hover:bg-background text-xs font-medium tracking-wide disabled:opacity-50"
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {isOutOfStock ? "Sold Out" : "Quick Add"}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 bg-background/95 backdrop-blur-sm hover:bg-background hidden sm:flex"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>

      {/* Wishlist Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-3 top-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-300",
          "sm:opacity-0 sm:group-hover:opacity-100",
          "hover:bg-background hover:scale-110",
          isWishlisted && "opacity-100 text-red-500"
        )}
        onClick={handleWishlistClick}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={cn("h-4 w-4 transition-transform", isWishlisted && "fill-current")} />
      </Button>

      {/* Product Info */}
      <div className="mt-4 space-y-2">
        {/* Category */}
        {product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            {product.category.name}
          </Link>
        )}

        {/* Name */}
        <h3 className="font-serif text-lg font-medium leading-tight tracking-tight">
          <Link
            href={productUrl}
            className="hover:text-muted-foreground transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        {/* Color name or variant count */}
        {product._colorVariant ? (
          <div className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full border border-border"
              style={{ backgroundColor: product._colorVariant.colorHex || undefined }}
            />
            <p className="text-xs text-muted-foreground">{product._colorVariant.color}</p>
          </div>
        ) : variantCount > 1 ? (
          <p className="text-xs text-muted-foreground">
            {variantCount} variants available
          </p>
        ) : null}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-medium">{formatPrice(price)}</span>
          {compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
