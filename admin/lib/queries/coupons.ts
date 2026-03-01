'use server'

import { ObjectId } from 'mongodb'
import { getCouponsCollection } from '@/lib/db/collections'
import { toObjectId, paginate, totalPages } from '@/lib/db/helpers'

export interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number | null
  max_discount: number | null
  usage_limit: number | null
  usage_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export interface CouponFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive' | 'expired'
  type?: 'all' | 'percentage' | 'fixed'
  page?: number
  limit?: number
}

export interface CouponStats {
  total_coupons: number
  active_coupons: number
  total_usage: number
  total_savings: number
}

export interface PaginatedCoupons {
  coupons: Coupon[]
  total: number
  page: number
  totalPages: number
}

export interface CreateCouponData {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount?: number
  max_discount?: number
  usage_limit?: number
  valid_from: string
  valid_until?: string
  is_active?: boolean
}

export interface UpdateCouponData {
  code?: string
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  min_order_amount?: number
  max_discount?: number
  usage_limit?: number
  valid_from?: string
  valid_until?: string
  is_active?: boolean
}

/**
 * Get paginated coupons with filters
 */
export async function getCoupons(filters?: CouponFilters): Promise<PaginatedCoupons> {
  const couponsCol = await getCouponsCollection()

  const { skip, limit: lim, page } = paginate(filters?.page, filters?.limit || 25)

  const filter: Record<string, any> = {}

  // Apply search filter
  if (filters?.search) {
    filter.code = { $regex: filters.search, $options: 'i' }
  }

  // Apply type filter - DB column is 'type'
  if (filters?.type && filters.type !== 'all') {
    filter.type = filters.type
  }

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    const now = new Date()

    switch (filters.status) {
      case 'active':
        filter.is_active = true
        filter.valid_from = { $lte: now }
        filter.$or = [
          { valid_until: null },
          { valid_until: { $gte: now } },
        ]
        break
      case 'inactive':
        filter.is_active = false
        break
      case 'expired':
        filter.valid_until = { $lt: now }
        break
    }
  }

  const [data, total] = await Promise.all([
    couponsCol.find(filter).sort({ created_at: -1 }).skip(skip).limit(lim).toArray(),
    couponsCol.countDocuments(filter),
  ])

  // Map DB columns (type -> discount_type, value -> discount_value)
  const coupons: Coupon[] = data.map(coupon => ({
    id: coupon._id.toString(),
    code: coupon.code,
    discount_type: coupon.type,
    discount_value: coupon.value,
    min_order_amount: coupon.min_order_amount,
    max_discount: coupon.max_discount,
    usage_limit: coupon.usage_limit,
    usage_count: coupon.usage_count || 0,
    valid_from: coupon.valid_from.toISOString(),
    valid_until: coupon.valid_until?.toISOString() || null,
    is_active: coupon.is_active,
    created_at: coupon.created_at.toISOString(),
  }))

  return {
    coupons,
    total,
    page,
    totalPages: totalPages(total, lim),
  }
}

/**
 * Get coupon statistics
 */
export async function getCouponStats(): Promise<CouponStats> {
  const couponsCol = await getCouponsCollection()

  const now = new Date()

  const [totalCoupons, activeCoupons, couponsData] = await Promise.all([
    couponsCol.countDocuments(),
    couponsCol.countDocuments({
      is_active: true,
      valid_from: { $lte: now },
      $or: [
        { valid_until: null },
        { valid_until: { $gte: now } },
      ],
    }),
    couponsCol.find(
      {},
      { projection: { usage_count: 1, type: 1, value: 1 } }
    ).toArray(),
  ])

  let totalUsage = 0
  let totalSavings = 0

  for (const coupon of couponsData) {
    totalUsage += coupon.usage_count || 0
    if (coupon.type === 'percentage') {
      totalSavings += (coupon.usage_count || 0) * (coupon.value * 10)
    } else {
      totalSavings += (coupon.usage_count || 0) * coupon.value
    }
  }

  return {
    total_coupons: totalCoupons,
    active_coupons: activeCoupons,
    total_usage: totalUsage,
    total_savings: totalSavings,
  }
}

/**
 * Get coupon by ID
 */
export async function getCouponById(id: string): Promise<Coupon | null> {
  const couponsCol = await getCouponsCollection()

  const data = await couponsCol.findOne({ _id: toObjectId(id) })
  if (!data) return null

  return {
    id: data._id.toString(),
    code: data.code,
    discount_type: data.type,
    discount_value: data.value,
    min_order_amount: data.min_order_amount,
    max_discount: data.max_discount,
    usage_limit: data.usage_limit,
    usage_count: data.usage_count || 0,
    valid_from: data.valid_from.toISOString(),
    valid_until: data.valid_until?.toISOString() || null,
    is_active: data.is_active,
    created_at: data.created_at.toISOString(),
  }
}

/**
 * Check if coupon code exists
 */
export async function checkCouponCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const couponsCol = await getCouponsCollection()

  const filter: Record<string, any> = { code: code.toUpperCase() }
  if (excludeId) {
    filter._id = { $ne: toObjectId(excludeId) }
  }

  const data = await couponsCol.findOne(filter, { projection: { _id: 1 } })
  return !!data
}
