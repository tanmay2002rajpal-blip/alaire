"use server"

import { createClient } from "@/lib/supabase/server"

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

  const supabase = await createClient()

  const { data: coupon, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single()

  if (error || !coupon) {
    return { success: false, message: "Invalid coupon code" }
  }

  const now = new Date()
  const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null
  const minOrder = Number(coupon.min_order_amount) || 0

  // Check date validity
  if (validFrom && now < validFrom) {
    return { success: false, message: "This coupon is not yet active" }
  }

  if (validUntil && now > validUntil) {
    return { success: false, message: "This coupon has expired" }
  }

  // Check minimum order
  if (subtotal < minOrder) {
    return {
      success: false,
      message: `Minimum order of ₹${minOrder} required for this coupon`,
    }
  }

  // Check usage limit (using correct column names: max_uses, current_uses)
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    return { success: false, message: "This coupon has reached its usage limit" }
  }

  // Calculate discount (using correct column names: type, value)
  const discountValue = Number(coupon.value) || 0
  const maxDiscountAmount = Number(coupon.max_discount_amount) || null
  let discount = 0

  if (coupon.type === "percentage") {
    discount = (subtotal * discountValue) / 100
    if (maxDiscountAmount) {
      discount = Math.min(discount, maxDiscountAmount)
    }
  } else {
    // Fixed discount
    discount = Math.min(discountValue, subtotal)
  }

  return {
    success: true,
    discount: Math.round(discount * 100) / 100,
    code: coupon.code,
    message: `Coupon applied! You save ₹${discount.toFixed(0)}`,
  }
}
