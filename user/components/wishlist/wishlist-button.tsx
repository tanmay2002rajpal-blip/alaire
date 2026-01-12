"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface WishlistButtonProps {
  productId: string
  isInWishlist?: boolean
  variant?: "default" | "icon"
  className?: string
}

export function WishlistButton({
  productId,
  isInWishlist = false,
  variant = "default",
  className,
}: WishlistButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [inWishlist, setInWishlist] = useState(isInWishlist)

  const handleToggle = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requireAuth) {
          toast.error("Please login", {
            description: data.message,
            action: {
              label: "Login",
              onClick: () => router.push("/auth/login"),
            },
          })
        } else {
          throw new Error(data.message)
        }
        return
      }

      setInWishlist(data.added)
      toast.success(data.added ? "Added to wishlist" : "Removed from wishlist")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
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
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={cn("h-4 w-4", inWishlist && "fill-current")}
          />
        )}
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
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <Heart
          className={cn(
            "mr-2 h-5 w-5",
            inWishlist && "fill-red-500 text-red-500"
          )}
        />
      )}
      {inWishlist ? "In Wishlist" : "Wishlist"}
    </Button>
  )
}
