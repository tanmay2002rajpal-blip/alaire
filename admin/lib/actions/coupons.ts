'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateCouponData, UpdateCouponData } from '@/lib/queries/coupons'

interface ActionResult {
  success: boolean
  couponId?: string
  error?: string
}

/**
 * Server action to create a new coupon
 */
export async function createCouponAction(data: CreateCouponData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Validate code
    if (!data.code || data.code.length < 3) {
      return { success: false, error: 'Coupon code must be at least 3 characters' }
    }

    // Normalize code to uppercase
    const normalizedCode = data.code.toUpperCase().trim()

    // Check if code already exists
    const { data: existingCoupon } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', normalizedCode)
      .single()

    if (existingCoupon) {
      return { success: false, error: 'A coupon with this code already exists' }
    }

    // Validate discount value
    if (data.discount_value <= 0) {
      return { success: false, error: 'Discount value must be greater than 0' }
    }

    if (data.discount_type === 'percentage' && data.discount_value > 100) {
      return { success: false, error: 'Percentage discount cannot exceed 100%' }
    }

    // Create coupon - map to database column names (type, value)
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: normalizedCode,
        type: data.discount_type,
        value: data.discount_value,
        min_order_amount: data.min_order_amount || null,
        max_discount: data.max_discount || null,
        usage_limit: data.usage_limit || null,
        usage_count: 0,
        valid_from: data.valid_from,
        valid_until: data.valid_until || null,
        is_active: data.is_active !== false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/coupons')
    return { success: true, couponId: coupon.id }
  } catch (error) {
    console.error('Error in createCouponAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to update a coupon
 */
export async function updateCouponAction(
  id: string,
  data: UpdateCouponData
): Promise<ActionResult> {
  try {
    if (!id) {
      return { success: false, error: 'Coupon ID is required' }
    }

    const supabase = await createClient()

    // Build update object
    const updateData: Record<string, any> = {}

    if (data.code !== undefined) {
      const normalizedCode = data.code.toUpperCase().trim()

      // Check if code already exists for another coupon
      const { data: existingCoupon } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', normalizedCode)
        .neq('id', id)
        .single()

      if (existingCoupon) {
        return { success: false, error: 'A coupon with this code already exists' }
      }

      updateData.code = normalizedCode
    }

    // Map interface names to database column names
    if (data.discount_type !== undefined) updateData.type = data.discount_type
    if (data.discount_value !== undefined) {
      if (data.discount_value <= 0) {
        return { success: false, error: 'Discount value must be greater than 0' }
      }
      if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return { success: false, error: 'Percentage discount cannot exceed 100%' }
      }
      updateData.value = data.discount_value
    }
    if (data.min_order_amount !== undefined) updateData.min_order_amount = data.min_order_amount
    if (data.max_discount !== undefined) updateData.max_discount = data.max_discount
    if (data.usage_limit !== undefined) updateData.usage_limit = data.usage_limit
    if (data.valid_from !== undefined) updateData.valid_from = data.valid_from
    if (data.valid_until !== undefined) updateData.valid_until = data.valid_until
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating coupon:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/coupons')
    return { success: true, couponId: id }
  } catch (error) {
    console.error('Error in updateCouponAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to delete a coupon
 */
export async function deleteCouponAction(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return { success: false, error: 'Coupon ID is required' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting coupon:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/coupons')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteCouponAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to toggle coupon active status
 */
export async function toggleCouponStatusAction(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return { success: false, error: 'Coupon ID is required' }
    }

    const supabase = await createClient()

    // Get current status
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { success: false, error: 'Coupon not found' }
    }

    // Toggle status
    const { error } = await supabase
      .from('coupons')
      .update({
        is_active: !coupon.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error toggling coupon status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/coupons')
    return { success: true }
  } catch (error) {
    console.error('Error in toggleCouponStatusAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Generate a random coupon code
 */
export async function generateCouponCodeAction(): Promise<{
  success: boolean
  code?: string
  error?: string
}> {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''

  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  // Check if code exists
  const supabase = await createClient()
  const { data: existingCoupon } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', code)
    .single()

  if (existingCoupon) {
    // Try again with a different code
    return generateCouponCodeAction()
  }

  return { success: true, code }
}
