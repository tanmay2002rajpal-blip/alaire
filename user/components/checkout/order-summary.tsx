"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2, Tag, X, Wallet, Clock, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { validateCoupon } from "@/lib/actions/coupon"
import { getSampleProductImage } from "@/lib/sample-images"
import { toast } from "sonner"
import type { CartItem } from "@/hooks/use-cart"

interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  discount?: number
  shipping?: number
  walletBalance?: number
  useWallet?: boolean
  walletAmountUsed?: number
  couponCode?: string
  onCouponApply?: (code: string, discount: number) => void
  onCouponRemove?: () => void
  onWalletToggle?: (use: boolean) => void
}

export function OrderSummary({
  items,
  subtotal,
  discount = 0,
  shipping = 0,
  walletBalance = 0,
  useWallet = false,
  walletAmountUsed = 0,
  couponCode,
  onCouponApply,
  onCouponRemove,
  onWalletToggle,
}: OrderSummaryProps) {
  const [couponInput, setCouponInput] = useState("")
  const [isValidating, setIsValidating] = useState(false)
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

  useEffect(() => {
    if (subtotal <= 0) return
    fetch(`/api/coupons/available?subtotal=${subtotal}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setAvailableCoupons(data))
      .catch(() => {})
  }, [subtotal])

  const afterDiscount = subtotal - discount + shipping
  const total = Math.max(0, afterDiscount - walletAmountUsed)

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error("Please enter a coupon code")
      return
    }

    setIsValidating(true)
    try {
      const result = await validateCoupon(couponInput.trim(), subtotal)
      if (result.success && result.discount) {
        onCouponApply?.(result.code!, result.discount)
        setCouponInput("")
        toast.success(result.message)
      } else {
        toast.error(result.message || "Invalid coupon")
      }
    } catch {
      toast.error("Failed to validate coupon")
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveCoupon = () => {
    onCouponRemove?.()
    toast.success("Coupon removed")
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => {
            const imageUrl = item.image && !item.image.includes("placehold") && !item.image.includes("placeholder")
              ? item.image
              : getSampleProductImage(item.name)

            return (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={imageUrl}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                <p className="font-medium leading-tight">{item.name}</p>
                {item.variantName && (
                  <p className="text-sm text-muted-foreground">
                    {item.variantName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="font-medium">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
            )
          })}
        </div>

        <Separator />

        {/* Coupon Code */}
        {onCouponApply && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Coupon Code</p>
            {couponCode ? (
              <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {couponCode}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-green-600 hover:text-green-800 hover:bg-green-100"
                  onClick={handleRemoveCoupon}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  className="uppercase"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Available Coupons */}
        {!couponCode && availableCoupons.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              Available Offers
            </p>
            <div className="space-y-1.5">
              {availableCoupons.map((coupon) => (
                <div
                  key={coupon.code}
                  className={`border rounded-lg p-2.5 text-xs ${
                    coupon.is_eligible
                      ? "border-green-200 bg-green-50/50 cursor-pointer hover:border-green-300 transition-colors"
                      : coupon.is_upcoming
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-muted bg-muted/30"
                  }`}
                  onClick={() => {
                    if (coupon.is_eligible && onCouponApply) {
                      setCouponInput(coupon.code)
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-bold text-xs tracking-wide">
                      {coupon.code}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(coupon.code)
                        setCopiedCode(coupon.code)
                        setTimeout(() => setCopiedCode(null), 2000)
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
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
                    <p className="text-green-700 font-medium mt-0.5">
                      You save {formatPrice(coupon.savings)}
                    </p>
                  )}
                  {coupon.is_upcoming && (
                    <p className="text-amber-700 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Available from {new Date(coupon.valid_from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  )}
                  {!coupon.is_eligible && !coupon.is_upcoming && coupon.shortfall > 0 && (
                    <p className="text-muted-foreground mt-0.5">
                      Add {formatPrice(coupon.shortfall)} more to use this code
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wallet */}
        {onWalletToggle && walletBalance > 0 && (
          <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="use-wallet"
                checked={useWallet}
                onCheckedChange={(checked) => onWalletToggle(!!checked)}
              />
              <label
                htmlFor="use-wallet"
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Wallet className="h-4 w-4" />
                <span>Use Wallet Balance</span>
              </label>
            </div>
            <span className="text-sm font-medium">
              {formatPrice(walletBalance)}
            </span>
          </div>
        )}

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({couponCode})</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {shipping > 0 ? formatPrice(shipping) : "Free"}
            </span>
          </div>
          {walletAmountUsed > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Wallet Applied</span>
              <span>-{formatPrice(walletAmountUsed)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
