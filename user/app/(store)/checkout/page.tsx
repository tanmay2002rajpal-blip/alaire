"use client"

import { useState, useEffect, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { OrderSummary } from "@/components/checkout/order-summary"
import { useSession } from "next-auth/react"

// Hydration-safe mounted check
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCart()
  const mounted = useIsMounted()

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>("")
  const [discount, setDiscount] = useState(0)

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [useWallet, setUseWallet] = useState(false)

  // Shipping state (from pincode checker)
  const [shippingCost, setShippingCost] = useState(0)

  const { data: session } = useSession()

  useEffect(() => {
    async function fetchWallet() {
      if (!session?.user?.id) return
      try {
        const res = await fetch("/api/account/wallet-balance")
        if (res.ok) {
          const data = await res.json()
          setWalletBalance(data.balance || 0)
        }
      } catch {
        // Wallet fetch failed, default to 0
      }
    }
    fetchWallet()
  }, [session])

  if (!mounted) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
          <div>
            <h1 className="text-2xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground">
              Add items to your cart to checkout
            </p>
          </div>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()

  // Calculate wallet amount to use
  const afterDiscountAndShipping = subtotal - discount + shippingCost
  const walletAmountUsed = useWallet
    ? Math.min(walletBalance, afterDiscountAndShipping)
    : 0

  const handleCouponApply = (code: string, discountAmount: number) => {
    setCouponCode(code)
    setDiscount(discountAmount)
  }

  const handleCouponRemove = () => {
    setCouponCode("")
    setDiscount(0)
  }

  const handleWalletToggle = (use: boolean) => {
    setUseWallet(use)
  }

  const handleShippingChange = (cost: number) => {
    setShippingCost(cost)
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/cart" className="hover:text-foreground">
          Cart
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Checkout</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Checkout Form */}
        <div className="lg:col-span-7">
          <CheckoutForm
            items={items}
            subtotal={subtotal}
            discount={discount}
            shippingCost={shippingCost}
            walletAmountUsed={walletAmountUsed}
            couponCode={couponCode}
            onShippingChange={handleShippingChange}
            onSuccess={() => {
              clearCart()
              router.push("/account/orders")
            }}
          />
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            discount={discount}
            shipping={shippingCost}
            walletBalance={walletBalance}
            useWallet={useWallet}
            walletAmountUsed={walletAmountUsed}
            couponCode={couponCode}
            onCouponApply={handleCouponApply}
            onCouponRemove={handleCouponRemove}
            onWalletToggle={handleWalletToggle}
          />
        </div>
      </div>
    </div>
  )
}
