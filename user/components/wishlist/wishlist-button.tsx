"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useWishlist } from "@/hooks"
import { useAuth } from "@/components/auth/auth-provider"

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
  const { isInWishlist, toggleWishlist, hydrateFromServer } = useWishlist()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Hydrate the local store from the DB wishlist once the user is authenticated.
  useEffect(() => {
    if (user) hydrateFromServer()
  }, [user, hydrateFromServer])

  const inWishlist = mounted && isInWishlist(productId)

  const handleToggle = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    const wasInWishlist = isInWishlist(productId)
    // Optimistic local update (also keeps guest wishlists in localStorage).
    toggleWishlist(productId)
    toast.success(wasInWishlist ? "Removed from wishlist" : "Added to wishlist")

    // Persist to the DB for authenticated users.
    if (user) {
      try {
        const res = await fetch("/api/wishlist/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        })
        if (!res.ok) {
          // Revert optimistic change on failure.
          toggleWishlist(productId)
          toast.error("Could not update wishlist. Please try again.")
        }
      } catch {
        toggleWishlist(productId)
        toast.error("Could not update wishlist. Please try again.")
      }
    }
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
