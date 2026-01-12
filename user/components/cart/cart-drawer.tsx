"use client"

import Link from "next/link"
import { ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCart } from "@/hooks"
import { formatPrice } from "@/lib/utils"
import { CartItem } from "./cart-item"

export function CartDrawer() {
  const { items, isOpen, closeCart, getSubtotal, getItemCount } = useCart()

  const subtotal = getSubtotal()
  const itemCount = getItemCount()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col px-6 sm:max-w-lg">
        <SheetHeader className="px-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Add items to get started
              </p>
            </div>
            <Button asChild onClick={closeCart}>
              <Link href="/products">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="divide-y">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground">Calculated at checkout</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <SheetFooter className="flex-col gap-2 px-0 sm:flex-col">
                <Button asChild size="lg" className="w-full" onClick={closeCart}>
                  <Link href="/checkout">
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  asChild
                  onClick={closeCart}
                >
                  <Link href="/cart">View Cart</Link>
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
