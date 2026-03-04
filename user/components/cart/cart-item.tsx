"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedQuantity } from "@/components/ui/animated-quantity"
import { useCart, type CartItem as CartItemType } from "@/hooks"
import { formatPrice } from "@/lib/utils"
import { getSampleProductImage } from "@/lib/sample-images"

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()

  const imageUrl = useMemo(() => {
    if (item.image && !item.image.includes("placehold") && !item.image.includes("placeholder")) {
      return item.image
    }
    return getSampleProductImage(item.name)
  }, [item.image, item.name])

  return (
    <div className="group flex gap-4 py-5 transition-colors hover:bg-muted/30 -mx-4 px-4 rounded-lg">
      {/* Image */}
      <Link
        href={`/products/${item.productId}`}
        className="relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted/50 transition-transform hover:scale-105"
      >
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between py-1">
        <div className="flex justify-between gap-2">
          <div>
            <Link
              href={`/products/${item.productId}`}
              className="font-medium transition-colors hover:text-muted-foreground"
            >
              {item.name}
            </Link>
            {item.variantName && (
              <p className="mt-0.5 text-sm text-muted-foreground">{item.variantName}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
            onClick={() => removeItem(item.id)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Animated Quantity Controls */}
          <AnimatedQuantity
            value={item.quantity}
            onChange={(newQuantity) => updateQuantity(item.id, newQuantity)}
            min={1}
            max={item.maxQuantity ?? 10}
            size="sm"
          />

          {/* Price */}
          <div className="text-right">
            <p className="font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
            {item.quantity > 1 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatPrice(item.price)} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
