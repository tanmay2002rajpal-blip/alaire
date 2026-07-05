'use server'

import { ObjectId } from 'mongodb'
import { getCouponsCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'
import type { CreateCouponData, UpdateCouponData } from '@/lib/queries/coupons'

interface ActionResult {
  success: boolean
  couponId?: string
  error?: string
}

// Fields that can be explicitly cleared (null = unset) plus the hidden flag.
// The base types in queries/coupons.ts declare these as non-nullable optionals,
// so we widen them here to allow null and add is_hidden without editing that file.
type CouponWritableExtras = {
  is_hidden?: boolean
  buy_quantity?: number | null
  get_quantity?: number | null
  min_order_amount?: number | null
  max_discount?: number | null
  usage_limit?: number | null
  valid_until?: string | null
}
type CreateCouponInput = Omit<
  CreateCouponData,
  'buy_quantity' | 'get_quantity' | 'min_order_amount' | 'max_discount' | 'usage_limit' | 'valid_until'
> & CouponWritableExtras
type UpdateCouponInput = Omit<
  UpdateCouponData,
  'buy_quantity' | 'get_quantity' | 'min_order_amount' | 'max_discount' | 'usage_limit' | 'valid_until'
> & CouponWritableExtras

// Build a Date at the START of the given day in IST (+05:30).
function istStartOfDay(dateStr: string): Date {
  const day = dateStr.split('T')[0]
  return new Date(`${day}T00:00:00.000+05:30`)
}

// Build a Date at the END of the given day in IST (+05:30) so the advertised
// final day remains fully valid.
function istEndOfDay(dateStr: string): Date {
  const day = dateStr.split('T')[0]
  return new Date(`${day}T23:59:59.999+05:30`)
}

/**
 * Server action to create a new coupon
 */
export async function createCouponAction(data: CreateCouponInput): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const couponsCol = await getCouponsCollection()

    if (!data.code || data.code.length < 3) {
      return { success: false, error: 'Coupon code must be at least 3 characters' }
    }

    const normalizedCode = data.code.toUpperCase().trim()

    // Check if code already exists
    const existing = await couponsCol.findOne({ code: normalizedCode })
    if (existing) {
      return { success: false, error: 'A coupon with this code already exists' }
    }

    if (data.discount_type === 'buy_x_get_y') {
      if (!data.buy_quantity || data.buy_quantity < 1) {
        return { success: false, error: 'Buy quantity must be at least 1' }
      }
      if (!data.get_quantity || data.get_quantity < 1) {
        return { success: false, error: 'Get quantity must be at least 1' }
      }
    } else {
      if (data.discount_value <= 0) {
        return { success: false, error: 'Discount value must be greater than 0' }
      }
      if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return { success: false, error: 'Percentage discount cannot exceed 100%' }
      }
    }

    const now = new Date()
    const couponId = new ObjectId()

    await couponsCol.insertOne({
      _id: couponId,
      code: normalizedCode,
      type: data.discount_type,
      value: data.discount_value,
      buy_quantity: data.discount_type === 'buy_x_get_y' ? (data.buy_quantity || null) : null,
      get_quantity: data.discount_type === 'buy_x_get_y' ? (data.get_quantity || null) : null,
      min_order_amount: data.min_order_amount || null,
      max_discount: data.max_discount || null,
      usage_limit: data.usage_limit || null,
      usage_count: 0,
      valid_from: istStartOfDay(data.valid_from),
      valid_until: data.valid_until ? istEndOfDay(data.valid_until) : null,
      is_active: data.is_active !== false,
      is_hidden: data.is_hidden === true,
      created_at: now,
      updated_at: now,
    })

    revalidatePath('/coupons')
    return { success: true, couponId: couponId.toString() }
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
  data: UpdateCouponInput
): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!id) {
      return { success: false, error: 'Coupon ID is required' }
    }

    const couponsCol = await getCouponsCollection()
    const oid = toObjectId(id)

    const updateData: Record<string, any> = {}

    if (data.code !== undefined) {
      const normalizedCode = data.code.toUpperCase().trim()

      const existing = await couponsCol.findOne({
        code: normalizedCode,
        _id: { $ne: oid },
      })
      if (existing) {
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
    if (data.buy_quantity !== undefined) updateData.buy_quantity = data.buy_quantity
    if (data.get_quantity !== undefined) updateData.get_quantity = data.get_quantity
    if (data.min_order_amount !== undefined) updateData.min_order_amount = data.min_order_amount
    if (data.max_discount !== undefined) updateData.max_discount = data.max_discount
    if (data.usage_limit !== undefined) updateData.usage_limit = data.usage_limit
    if (data.valid_from !== undefined) updateData.valid_from = istStartOfDay(data.valid_from)
    if (data.valid_until !== undefined) updateData.valid_until = data.valid_until ? istEndOfDay(data.valid_until) : null
    if (data.is_active !== undefined) updateData.is_active = data.is_active
    if (data.is_hidden !== undefined) updateData.is_hidden = data.is_hidden

    updateData.updated_at = new Date()

    await couponsCol.updateOne({ _id: oid }, { $set: updateData })

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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!id) {
      return { success: false, error: 'Coupon ID is required' }
    }

    const couponsCol = await getCouponsCollection()
    await couponsCol.deleteOne({ _id: toObjectId(id) })

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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!id) {
      return { success: false, error: 'Coupon ID is required' }
    }

    const couponsCol = await getCouponsCollection()
    const coupon = await couponsCol.findOne(
      { _id: toObjectId(id) },
      { projection: { is_active: 1 } }
    )

    if (!coupon) {
      return { success: false, error: 'Coupon not found' }
    }

    await couponsCol.updateOne(
      { _id: toObjectId(id) },
      { $set: { is_active: !coupon.is_active, updated_at: new Date() } }
    )

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
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const couponsCol = await getCouponsCollection()

  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    const existing = await couponsCol.findOne({ code })
    if (!existing) {
      return { success: true, code }
    }
  }

  return { success: false, error: 'Could not generate unique code after 10 attempts' }
}
