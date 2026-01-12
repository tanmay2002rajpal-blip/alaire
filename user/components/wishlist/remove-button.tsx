"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface RemoveFromWishlistButtonProps {
  itemId: string
}

export function RemoveFromWishlistButton({ itemId }: RemoveFromWishlistButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleRemove = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/wishlist/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      toast.success("Removed from wishlist")
      router.refresh()
    } catch {
      toast.error("Failed to remove item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-2 top-2 h-8 w-8 rounded-full"
      onClick={handleRemove}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <X className="h-4 w-4" />
      )}
      <span className="sr-only">Remove from wishlist</span>
    </Button>
  )
}
