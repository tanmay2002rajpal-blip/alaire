'use server'

import { createClient } from '@/lib/supabase/server'

export interface Customer {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  created_at: string
  last_order_at: string | null
  total_orders: number
  total_spent: number
  is_active: boolean
}

export interface CustomerDetail extends Customer {
  addresses: CustomerAddress[]
  recent_orders: CustomerOrder[]
}

export interface CustomerAddress {
  id: string
  type: 'billing' | 'shipping'
  full_name: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  phone: string | null
  is_default: boolean
}

export interface CustomerOrder {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
}

export interface CustomerFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  sort_by?: 'created_at' | 'total_spent' | 'total_orders' | 'last_order'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface CustomerStats {
  total_customers: number
  new_this_month: number
  active_customers: number
  total_revenue: number
}

export interface PaginatedCustomers {
  customers: Customer[]
  total: number
  page: number
  totalPages: number
}

/**
 * Get paginated customers with filters
 */
export async function getCustomers(filters?: CustomerFilters): Promise<PaginatedCustomers> {
  const supabase = await createClient()

  const page = filters?.page || 1
  const limit = filters?.limit || 25
  const offset = (page - 1) * limit
  const sortBy = filters?.sort_by || 'created_at'
  const sortOrder = filters?.sort_order || 'desc'

  // Get profiles with their order stats
  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      phone,
      created_at,
      is_active,
      orders (
        id,
        total,
        created_at
      )
    `, { count: 'exact' })

  // Apply search filter
  if (filters?.search) {
    const searchTerm = '%' + filters.search + '%'
    query = query.or('email.ilike.' + searchTerm + ',full_name.ilike.' + searchTerm + ',phone.ilike.' + searchTerm)
  }

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('is_active', filters.status === 'active')
  }

  // Apply sorting (only for direct columns)
  if (sortBy === 'created_at') {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data: profilesData, error, count } = await query

  if (error) {
    console.error('Error fetching customers:', error)
    throw new Error('Failed to fetch customers')
  }

  // Transform data to include calculated fields
  const customers: Customer[] = (profilesData || []).map(profile => {
    const orders = Array.isArray(profile.orders) ? profile.orders : []
    const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    const lastOrder = orders.length > 0
      ? orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : null

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      created_at: profile.created_at,
      last_order_at: lastOrder?.created_at || null,
      total_orders: orders.length,
      total_spent: totalSpent,
      is_active: profile.is_active ?? true,
    }
  })

  // Sort by calculated fields if needed
  if (sortBy === 'total_spent' || sortBy === 'total_orders' || sortBy === 'last_order') {
    customers.sort((a, b) => {
      let aVal: number, bVal: number

      if (sortBy === 'total_spent') {
        aVal = a.total_spent
        bVal = b.total_spent
      } else if (sortBy === 'total_orders') {
        aVal = a.total_orders
        bVal = b.total_orders
      } else {
        aVal = a.last_order_at ? new Date(a.last_order_at).getTime() : 0
        bVal = b.last_order_at ? new Date(b.last_order_at).getTime() : 0
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    customers,
    total,
    page,
    totalPages,
  }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(): Promise<CustomerStats> {
  const supabase = await createClient()

  // Get total customers
  const { count: totalCustomers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get new customers this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: newThisMonth } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  // Get customers who ordered in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: activeOrders } = await supabase
    .from('orders')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const activeCustomerIds = new Set(activeOrders?.map(o => o.user_id) || [])

  // Get total revenue
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'delivered')

  const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

  return {
    total_customers: totalCustomers || 0,
    new_this_month: newThisMonth || 0,
    active_customers: activeCustomerIds.size,
    total_revenue: totalRevenue,
  }
}

/**
 * Get customer by ID with full details
 */
export async function getCustomerById(id: string): Promise<CustomerDetail | null> {
  const supabase = await createClient()

  // Get profile with orders
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      phone,
      created_at,
      is_active,
      orders (
        id,
        order_number,
        status,
        total,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching customer:', profileError)
    return null
  }

  // Get addresses
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', id)
    .order('is_default', { ascending: false })

  const orders = Array.isArray(profile.orders) ? profile.orders : []
  const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
  const lastOrder = orders.length > 0
    ? orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone,
    created_at: profile.created_at,
    last_order_at: lastOrder?.created_at || null,
    total_orders: orders.length,
    total_spent: totalSpent,
    is_active: profile.is_active ?? true,
    addresses: (addresses || []).map(addr => ({
      id: addr.id,
      type: addr.type || 'shipping',
      full_name: addr.full_name || '',
      address_line_1: addr.address_line_1 || '',
      address_line_2: addr.address_line_2,
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      country: addr.country || '',
      phone: addr.phone,
      is_default: addr.is_default || false,
    })),
    recent_orders: orders.slice(0, 10).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
    })),
  }
}
