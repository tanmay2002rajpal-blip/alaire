'use server'

import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()

  const page = filters?.page || 1
  const limit = filters?.limit || 25
  const offset = (page - 1) * limit

  let query = supabase
    .from('coupons')
    .select('*', { count: 'exact' })

  // Apply search filter (only code since description doesn't exist)
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.ilike('code', searchTerm)
  }

  // Apply type filter - database column is 'type' not 'discount_type'
  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    const now = new Date().toISOString()

    switch (filters.status) {
      case 'active':
        query = query
          .eq('is_active', true)
          .lte('valid_from', now)
          .or(`valid_until.is.null,valid_until.gte.${now}`)
        break
      case 'inactive':
        query = query.eq('is_active', false)
        break
      case 'expired':
        query = query.lt('valid_until', now)
        break
    }
  }

  // Order by created_at desc
  query = query.order('created_at', { ascending: false })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching coupons:', error)
    throw new Error('Failed to fetch coupons')
  }

  // Map database columns to interface (type -> discount_type, value -> discount_value)
  const coupons: Coupon[] = (data || []).map(coupon => ({
    id: coupon.id,
    code: coupon.code,
    discount_type: coupon.type as 'percentage' | 'fixed',
    discount_value: coupon.value,
    min_order_amount: coupon.min_order_amount,
    max_discount: coupon.max_discount,
    usage_limit: coupon.usage_limit,
    usage_count: coupon.usage_count || 0,
    valid_from: coupon.valid_from,
    valid_until: coupon.valid_until,
    is_active: coupon.is_active,
    created_at: coupon.created_at,
  }))

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    coupons,
    total,
    page,
    totalPages,
  }
}

/**
 * Get coupon statistics
 */
export async function getCouponStats(): Promise<CouponStats> {
  const supabase = await createClient()

  const now = new Date().toISOString()

  // Get total coupons
  const { count: totalCoupons } = await supabase
    .from('coupons')
    .select('*', { count: 'exact', head: true })

  // Get active coupons
  const { count: activeCoupons } = await supabase
    .from('coupons')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .lte('valid_from', now)
    .or(`valid_until.is.null,valid_until.gte.${now}`)

  // Get usage stats - database uses 'type' and 'value' columns
  const { data: couponsData } = await supabase
    .from('coupons')
    .select('usage_count, type, value')

  let totalUsage = 0
  let totalSavings = 0

  couponsData?.forEach(coupon => {
    totalUsage += coupon.usage_count || 0
    // Estimate savings (this is a rough estimate)
    if (coupon.type === 'percentage') {
      totalSavings += (coupon.usage_count || 0) * (coupon.value * 10) // Rough estimate
    } else {
      totalSavings += (coupon.usage_count || 0) * coupon.value
    }
  })

  return {
    total_coupons: totalCoupons || 0,
    active_coupons: activeCoupons || 0,
    total_usage: totalUsage,
    total_savings: totalSavings,
  }
}

/**
 * Get coupon by ID
 */
export async function getCouponById(id: string): Promise<Coupon | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching coupon:', error)
    throw new Error('Failed to fetch coupon')
  }

  return {
    id: data.id,
    code: data.code,
    discount_type: data.type as 'percentage' | 'fixed',
    discount_value: data.value,
    min_order_amount: data.min_order_amount,
    max_discount: data.max_discount,
    usage_limit: data.usage_limit,
    usage_count: data.usage_count || 0,
    valid_from: data.valid_from,
    valid_until: data.valid_until,
    is_active: data.is_active,
    created_at: data.created_at,
  }
}

/**
 * Check if coupon code exists
 */
export async function checkCouponCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from('coupons')
    .select('id')
    .eq('code', code.toUpperCase())

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query.single()

  if (error && error.code === 'PGRST116') {
    return false
  }

  return !!data
}
