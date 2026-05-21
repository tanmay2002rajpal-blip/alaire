"use server"

import { getDb } from "@/lib/db/client"

export interface CouponValidationResult {
  success: boolean
  discount?: number
  code?: string
  message?: string
}

export async function validateCoupon(
  code: string,
  subtotal: number,
  cartItems?: { price: number; quantity: number }[]
): Promise<CouponValidationResult> {
  if (!code || code.trim().length === 0) {
    return { success: false, message: "Please enter a coupon code" }
  }

  const db = await getDb()

  const coupon = await db
    .collection("coupons")
    .findOne({ code: code.toUpperCase().trim(), is_active: true })

  if (!coupon) {
    return { success: false, message: "Invalid coupon code" }
  }

  const now = new Date()
  const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null
  const minOrder = Number(coupon.min_order_amount) || 0

  if (validFrom && now < validFrom) {
    return { success: false, message: "This coupon is not yet active" }
  }

  if (validUntil && now > validUntil) {
    return { success: false, message: "This coupon has expired" }
  }

  if (subtotal < minOrder) {
    return {
      success: false,
      message: `Minimum order of \u20B9${minOrder} required for this coupon`,
    }
  }

  const usageLimit = coupon.usage_limit ?? coupon.max_uses ?? null
  const usageCount = coupon.usage_count ?? coupon.current_uses ?? 0
  if (usageLimit !== null && usageCount >= usageLimit) {
    return { success: false, message: "This coupon has reached its usage limit" }
  }

  let discount = 0

  if (coupon.type === "buy_x_get_y") {
    const buyQty = Number(coupon.buy_quantity) || 2
    const getQty = Number(coupon.get_quantity) || 1
    const requiredQty = buyQty + getQty

    if (!cartItems || cartItems.length === 0) {
      return {
        success: false,
        message: `Add at least ${requiredQty} items to use this coupon`,
      }
    }

    const totalCartQty = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    if (totalCartQty < requiredQty) {
      return {
        success: false,
        message: `Add at least ${requiredQty} items (Buy ${buyQty} Get ${getQty} Free)`,
      }
    }

    // Expand items into individual unit prices, sorted ascending
    const unitPrices: number[] = []
    for (const item of cartItems) {
      for (let i = 0; i < item.quantity; i++) {
        unitPrices.push(item.price)
      }
    }
    unitPrices.sort((a, b) => a - b)

    // Cheapest `getQty` items are free
    for (let i = 0; i < Math.min(getQty, unitPrices.length); i++) {
      discount += unitPrices[i]
    }

    return {
      success: true,
      discount: Math.round(discount * 100) / 100,
      code: coupon.code,
      message: `Buy ${buyQty} Get ${getQty} Free applied! You save \u20B9${discount.toFixed(0)}`,
    }
  }

  const discountValue = Number(coupon.value) || 0
  const maxDiscountAmount = Number(coupon.max_discount) || Number(coupon.max_discount_amount) || null

  if (coupon.type === "percentage") {
    discount = (subtotal * discountValue) / 100
    if (maxDiscountAmount) {
      discount = Math.min(discount, maxDiscountAmount)
    }
  } else {
    discount = Math.min(discountValue, subtotal)
  }

  return {
    success: true,
    discount: Math.round(discount * 100) / 100,
    code: coupon.code,
    message: `Coupon applied! You save \u20B9${discount.toFixed(0)}`,
  }
}
