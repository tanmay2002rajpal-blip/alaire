"use client"

import { useState, useEffect } from "react"
import { Heart, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useWishlist } from "@/hooks"

interface WishlistButtonProps {
  productId: string
  variant?: "default" | "icon"
  className?: string
}

export function WishlistButton({
  productId,
  variant = "default",
  className,
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const inWishlist = mounted && isInWishlist(productId)

  const handleToggle = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    toggleWishlist(productId)
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist")
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full",
          inWishlist && "text-red-500",
          className
        )}
        onClick={handleToggle}
      >
        <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
        <span className="sr-only">
          {inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        </span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleToggle}
      className={className}
    >
      <Heart
        className={cn(
          "mr-2 h-5 w-5",
          inWishlist && "fill-red-500 text-red-500"
        )}
      />
      {inWishlist ? "In Wishlist" : "Wishlist"}
    </Button>
  )
}
