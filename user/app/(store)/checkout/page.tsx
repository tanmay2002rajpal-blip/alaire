"use client"

import { useState, useEffect, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, ShoppingBag, UserCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { OrderSummary } from "@/components/checkout/order-summary"
import { useAuth } from "@/components/auth/auth-provider"

// Hydration-safe mounted check
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

/**
 * Delivery-fee settings resolved from admin (GET /api/site-settings/delivery).
 */
interface DeliverySettings {
  deliveryFeeEnabled: boolean
  freeDeliveryThreshold: number
}

/**
 * Canonical shipping resolution — MUST stay identical to the server logic in
 * /api/checkout/create-order so the fee the customer sees always equals what
 * the server charges.
 *
 * - Delivery fee disabled       => always free (0)
 * - Subtotal >= free threshold  => free (0)
 * - Otherwise                   => the FShip pincode rate (0 until checked)
 */
function resolveShipping(
  subtotal: number,
  pincodeShippingCost: number,
  { deliveryFeeEnabled, freeDeliveryThreshold }: DeliverySettings
): number {
  if (!deliveryFeeEnabled) return 0
  if (subtotal >= freeDeliveryThreshold) return 0
  return pincodeShippingCost
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCart()
  const mounted = useIsMounted()
  const { openAuthDialog, user, isLoading: authLoading } = useAuth()
  const [isOrderProcessing, setIsOrderProcessing] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>("")
  const [discount, setDiscount] = useState(0)

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [useWallet, setUseWallet] = useState(false)

  // Raw pincode shipping rate (from the pincode checker / saved-address lookup).
  // This is the un-resolved FShip cost; the DISPLAYED/charged shipping is derived
  // from it via resolveShipping() below, honoring the admin delivery settings.
  const [pincodeShippingCost, setPincodeShippingCost] = useState(0)
  const [estimatedDays, setEstimatedDays] = useState(0)

  // Admin delivery-fee settings (single source of truth for free vs. paid shipping).
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    deliveryFeeEnabled: true,
    freeDeliveryThreshold: 999,
  })

  useEffect(() => {
    async function fetchWallet() {
      if (!user?.id) return
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
  }, [user])

  // Fetch admin delivery settings once on mount. Defaults stay {true, 999} on error.
  useEffect(() => {
    async function fetchDeliverySettings() {
      try {
        const res = await fetch("/api/site-settings/delivery")
        if (res.ok) {
          const data = await res.json()
          setDeliverySettings({
            deliveryFeeEnabled: data.deliveryFeeEnabled !== false,
            freeDeliveryThreshold:
              typeof data.freeDeliveryThreshold === "number" && isFinite(data.freeDeliveryThreshold)
                ? data.freeDeliveryThreshold
                : 999,
          })
        }
      } catch {
        // Keep defaults {true, 999} on error
      }
    }
    fetchDeliverySettings()
  }, [])

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

  if (isOrderProcessing) {
    return (
      <div className="container py-16">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted" />
            <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Processing your order...</h1>
            <p className="text-muted-foreground mt-1">
              Please wait while we confirm your order
            </p>
          </div>
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

  // Single source of truth for the shipping the customer SEES and is CHARGED.
  // Derived from the raw pincode rate + admin delivery settings, using the same
  // canonical logic as the server, so display == charge.
  const displayedShipping = resolveShipping(subtotal, pincodeShippingCost, deliverySettings)

  // Calculate wallet amount to use
  const afterDiscountAndShipping = subtotal - discount + displayedShipping
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

  const handleShippingChange = (cost: number, days?: number) => {
    // Store the RAW pincode rate; displayed/charged shipping is derived from it.
    setPincodeShippingCost(cost)
    if (days !== undefined) setEstimatedDays(days)
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

      {authLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      ) : !user ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-gray-50/50">
          <UserCircle2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Create an account to order</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Sign in with your email to quickly and securely place your order and track its status.
          </p>
          <Button size="lg" onClick={openAuthDialog}>
            Sign In with Email
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <CheckoutForm
              items={items}
              subtotal={subtotal}
              discount={discount}
              shippingCost={displayedShipping}
              estimatedDays={estimatedDays}
              walletAmountUsed={walletAmountUsed}
              couponCode={couponCode}
              onShippingChange={handleShippingChange}
              onVerifyingPayment={() => {
                setIsOrderProcessing(true)
              }}
              onSuccess={(orderId) => {
                setIsOrderProcessing(true)
                clearCart()
                router.push(`/order-confirmation/${orderId}`)
              }}
            />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              discount={discount}
              shipping={displayedShipping}
              estimatedDays={estimatedDays}
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
      )}
    </div>
  )
}
