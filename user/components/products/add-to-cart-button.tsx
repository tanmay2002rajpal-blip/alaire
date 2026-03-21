"use client"

import { useState } from "react"
import { ShoppingBag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useCart } from "@/hooks"

interface AddToCartButtonProps {
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  price: number
  compareAtPrice?: number
  image?: string
  maxQuantity?: number
  quantity?: number
  disabled?: boolean
  className?: string
}

export function AddToCartButton({
  productId,
  variantId,
  productName,
  variantName,
  price,
  compareAtPrice,
  image,
  maxQuantity = 10,
  quantity = 1,
  disabled,
  className,
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = async () => {
    if (disabled) return

    setIsLoading(true)

    try {
      addItem({
        productId,
        variantId,
        name: productName,
        variantName,
        price,
        compareAtPrice,
        image,
        maxQuantity,
        quantity,
      })

      toast.success("Added to cart", {
        description: `${productName}${variantName ? ` - ${variantName}` : ""} added to your cart`,
      })
    } catch {
      toast.error("Failed to add to cart", {
        description: "Please try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      size="lg"
      className={`h-14 sm:h-12 md:h-11 text-base sm:text-sm ${className || ""}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <ShoppingBag className="mr-2 h-5 w-5" />
      )}
      Add to Cart
    </Button>
  )
}
