"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Minus, Plus, Trash2, ShoppingBag, Tag, Clock, Copy, Check } from "lucide-react"
import { useCart, CartItem } from "@/hooks/use-cart"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount } = useCart()
  const { user, isLoading: authLoading, openAuthDialog } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  interface AvailableCoupon {
    code: string
    type: string
    value: number
    min_order_amount: number
    max_discount: number | null
    is_eligible: boolean
    is_upcoming: boolean
    valid_from: string
    savings: number
    shortfall: number
  }
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([])

  // Prevent hydration mismatch - cart state comes from localStorage
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch available coupons
  useEffect(() => {
    if (!mounted || items.length === 0) return
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    fetch(`/api/coupons/available?subtotal=${subtotal}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setAvailableCoupons(data))
      .catch(() => {})
  }, [mounted, items])

  if (!mounted) {
    return (
      <div className="container py-8">
        <h1 className="font-serif text-3xl md:text-4xl mb-8">Shopping Cart</h1>
        <div className="animate-pulse">
          <div className="h-24 bg-muted rounded-lg mb-4" />
          <div className="h-24 bg-muted rounded-lg mb-4" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="font-serif text-3xl md:text-4xl mb-8">Shopping Cart</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-6">Your cart is empty.</p>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const freeShipping = subtotal >= 999
  const total = subtotal

  return (
    <div className="container py-8">
      <h1 className="font-serif text-3xl md:text-4xl mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 overflow-hidden">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          {items.map((item: CartItem) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 border rounded-lg bg-card"
            >
              {/* Product Image */}
              <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="font-medium truncate">{item.name}</h3>
                    {item.variantName && (
                      <p className="text-sm text-muted-foreground">
                        {item.variantName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.maxQuantity ?? 10)}
                      className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} each
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 bg-card sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal ({getItemCount()} {getItemCount() === 1 ? "item" : "items"})
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{freeShipping ? "Free" : "Calculated at checkout"}</span>
              </div>

              {!freeShipping && (
                <p className="text-xs text-muted-foreground">
                  Free shipping on orders over ₹999
                </p>
              )}

              <Separator />

              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6"
              onClick={() => {
                if (!authLoading && !user) {
                  openAuthDialog()
                } else {
                  router.push("/checkout")
                }
              }}
            >
              Proceed to Checkout
            </Button>

            <Button asChild variant="outline" className="w-full mt-3">
              <Link href="/products">Continue Shopping</Link>
            </Button>

            {/* Available Coupons */}
            {availableCoupons.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4" />
                  Available Offers
                </h3>
                <div className="space-y-2">
                  {availableCoupons.map((coupon) => (
                    <div
                      key={coupon.code}
                      className={`border rounded-lg p-3 text-xs ${
                        coupon.is_eligible
                          ? "border-green-200 bg-green-50/50"
                          : coupon.is_upcoming
                          ? "border-amber-200 bg-amber-50/50"
                          : "border-muted bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-sm tracking-wide">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code)
                            setCopiedCode(coupon.code)
                            setTimeout(() => setCopiedCode(null), 2000)
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-muted-foreground">
                        {coupon.type === "percentage"
                          ? `${coupon.value}% off${coupon.max_discount ? ` (up to ${formatPrice(coupon.max_discount)})` : ""}`
                          : `${formatPrice(coupon.value)} off`}
                        {coupon.min_order_amount > 0 && ` on orders over ${formatPrice(coupon.min_order_amount)}`}
                      </p>
                      {coupon.is_eligible && coupon.savings > 0 && (
                        <p className="text-green-700 font-medium mt-1">
                          You save {formatPrice(coupon.savings)}
                        </p>
                      )}
                      {coupon.is_upcoming && (
                        <p className="text-amber-700 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Available from {new Date(coupon.valid_from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                      {!coupon.is_eligible && !coupon.is_upcoming && coupon.shortfall > 0 && (
                        <p className="text-muted-foreground mt-1">
                          Add {formatPrice(coupon.shortfall)} more to use this code
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
