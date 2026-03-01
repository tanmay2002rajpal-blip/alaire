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
  subtotal: number
): Promise<CouponValidationResult> {
  if (!code || code.trim().length === 0) {
    return { success: false, message: "Please enter a coupon code" }
  }

  const db = await getDb()

  const coupon = await db
    .collection("discount_codes")
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

  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    return { success: false, message: "This coupon has reached its usage limit" }
  }

  const discountValue = Number(coupon.value) || 0
  const maxDiscountAmount = Number(coupon.max_discount_amount) || null
  let discount = 0

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
