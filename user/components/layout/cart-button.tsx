"use client"

import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks"

export function CartButton() {
  const { openCart, getItemCount } = useCart()
  const itemCount = getItemCount()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openCart}
      className="relative"
    >
      <ShoppingBag className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-[10px] font-medium text-background flex items-center justify-center">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
      <span className="sr-only">Cart ({itemCount} items)</span>
    </Button>
  )
}
