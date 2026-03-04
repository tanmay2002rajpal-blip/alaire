'use server'

import { ObjectId } from 'mongodb'
import { getUsersCollection, getOrdersCollection, getAddressesCollection } from '@/lib/db/collections'
import { toObjectId, paginate, totalPages } from '@/lib/db/helpers'

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
  const usersCol = await getUsersCollection()
  const ordersCol = await getOrdersCollection()

  const { skip, limit: lim, page } = paginate(filters?.page, filters?.limit || 25)
  const sortBy = filters?.sort_by || 'created_at'
  const sortOrder = filters?.sort_order || 'desc'

  // Build filter
  const filter: Record<string, any> = {}

  if (filters?.search) {
    filter.$or = [
      { email: { $regex: filters.search, $options: 'i' } },
      { full_name: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } },
    ]
  }

  if (filters?.status && filters.status !== 'all') {
    filter.is_active = filters.status === 'active'
  }

  // Get profiles with sorting for created_at
  const mongoSort: Record<string, 1 | -1> = {}
  if (sortBy === 'created_at') {
    mongoSort.created_at = sortOrder === 'asc' ? 1 : -1
  } else {
    mongoSort.created_at = -1
  }

  const [profilesData, total] = await Promise.all([
    usersCol.find(filter).sort(mongoSort).skip(skip).limit(lim).toArray(),
    usersCol.countDocuments(filter),
  ])

  // Get order data for these users
  const userIds = profilesData.map(p => p._id)
  const ordersData = userIds.length > 0
    ? await ordersCol.find(
        { user_id: { $in: userIds } },
        { projection: { user_id: 1, total: 1, created_at: 1 } }
      ).toArray()
    : []

  // Aggregate orders per user
  const orderStats = new Map<string, { count: number; totalSpent: number; lastOrderAt: Date | null }>()
  for (const order of ordersData) {
    const uid = order.user_id.toString()
    if (!orderStats.has(uid)) {
      orderStats.set(uid, { count: 0, totalSpent: 0, lastOrderAt: null })
    }
    const stats = orderStats.get(uid)!
    stats.count += 1
    stats.totalSpent += order.total || 0
    if (!stats.lastOrderAt || order.created_at > stats.lastOrderAt) {
      stats.lastOrderAt = order.created_at
    }
  }

  // Transform data
  let customers: Customer[] = profilesData.map(profile => {
    const stats = orderStats.get(profile._id.toString()) || { count: 0, totalSpent: 0, lastOrderAt: null }

    return {
      id: profile._id.toString(),
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      created_at: profile.created_at ? new Date(profile.created_at).toISOString() : new Date().toISOString(),
      last_order_at: stats.lastOrderAt ? new Date(stats.lastOrderAt).toISOString() : null,
      total_orders: stats.count,
      total_spent: stats.totalSpent,
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

  return {
    customers,
    total,
    page,
    totalPages: totalPages(total, lim),
  }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(): Promise<CustomerStats> {
  const usersCol = await getUsersCollection()
  const ordersCol = await getOrdersCollection()

  // Get total customers
  const totalCustomers = await usersCol.countDocuments()

  // Get new customers this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const newThisMonth = await usersCol.countDocuments({ created_at: { $gte: startOfMonth } })

  // Get customers who ordered in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const activeOrders = await ordersCol.distinct('user_id', { created_at: { $gte: thirtyDaysAgo } })
  const activeCustomers = activeOrders.length

  // Get total revenue
  const revenueResult = await ordersCol.aggregate<{ _id: null; total: number }>([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]).toArray()

  return {
    total_customers: totalCustomers,
    new_this_month: newThisMonth,
    active_customers: activeCustomers,
    total_revenue: revenueResult[0]?.total || 0,
  }
}

/**
 * Get customer by ID with full details
 */
export async function getCustomerById(id: string): Promise<CustomerDetail | null> {
  const usersCol = await getUsersCollection()
  const ordersCol = await getOrdersCollection()
  const addressesCol = await getAddressesCollection()

  const oid = toObjectId(id)

  const profile = await usersCol.findOne({ _id: oid })
  if (!profile) return null

  // Get orders and addresses in parallel
  const [orders, addresses] = await Promise.all([
    ordersCol.find(
      { user_id: oid },
      { projection: { order_number: 1, status: 1, total: 1, created_at: 1 } }
    ).sort({ created_at: -1 }).toArray(),
    addressesCol.find({ user_id: oid }).sort({ is_default: -1 }).toArray(),
  ])

  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const lastOrder = orders.length > 0 ? orders[0] : null

  return {
    id: profile._id.toString(),
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone,
    created_at: profile.created_at ? new Date(profile.created_at).toISOString() : new Date().toISOString(),
    last_order_at: lastOrder?.created_at ? new Date(lastOrder.created_at).toISOString() : null,
    total_orders: orders.length,
    total_spent: totalSpent,
    is_active: profile.is_active ?? true,
    addresses: addresses.map(addr => ({
      id: addr._id.toString(),
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
    recent_orders: orders.slice(0, 10).map(order => ({
      id: order._id.toString(),
      order_number: order.order_number,
      status: order.status,
      total: order.total,
      created_at: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
    })),
  }
}
