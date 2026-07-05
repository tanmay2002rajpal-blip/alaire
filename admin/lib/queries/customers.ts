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

  const dir: 1 | -1 = sortOrder === 'asc' ? 1 : -1

  // Sort across the WHOLE collection (not just the current page). Computed
  // fields (total_orders / total_spent / last_order_at) are derived via a
  // $lookup into orders so sorting by them orders every matching customer,
  // then $skip/$limit paginate the already-sorted result.
  const sortStage: Record<string, 1 | -1> =
    sortBy === 'total_spent'
      ? { total_spent: dir, created_at: -1 }
      : sortBy === 'total_orders'
        ? { total_orders: dir, created_at: -1 }
        : sortBy === 'last_order'
          ? { last_order_at: dir, created_at: -1 }
          : { created_at: dir }

  const [profilesData, total] = await Promise.all([
    usersCol.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'orders',
          // user_id may be stored as ObjectId or string — compare as strings.
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: '$user_id' }, { $toString: '$$uid' }] } } },
            { $project: { total: 1, created_at: 1, status: 1 } },
          ],
          as: 'orders',
        },
      },
      {
        $addFields: {
          total_orders: { $size: '$orders' },
          // total_spent excludes cancelled/refunded orders.
          total_spent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    as: 'o',
                    cond: { $not: [{ $in: ['$$o.status', ['cancelled', 'refunded']] }] },
                  },
                },
                as: 'o',
                in: { $ifNull: ['$$o.total', 0] },
              },
            },
          },
          last_order_at: { $max: '$orders.created_at' },
        },
      },
      { $project: { orders: 0 } },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: lim },
    ]).toArray(),
    usersCol.countDocuments(filter),
  ])

  // Transform data
  const customers: Customer[] = profilesData.map(profile => ({
    id: profile._id.toString(),
    email: profile.email ?? null,
    full_name: profile.full_name ?? null,
    phone: profile.phone ?? null,
    created_at: profile.created_at ? new Date(profile.created_at).toISOString() : new Date().toISOString(),
    last_order_at: profile.last_order_at ? new Date(profile.last_order_at).toISOString() : null,
    total_orders: profile.total_orders || 0,
    total_spent: profile.total_spent || 0,
    is_active: profile.is_active ?? true,
  }))

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
    { $match: { status: { $in: ['delivered', 'shipped', 'processing', 'confirmed', 'paid'] } } },
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
    // user_id may be stored as ObjectId or string — match both forms.
    addressesCol.find({ user_id: { $in: [oid, oid.toString()] as unknown as ObjectId[] } }).sort({ is_default: -1 }).toArray(),
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
      // Storefront addresses use line1/line2/pincode; fall back to those.
      address_line_1: addr.address_line_1 || (addr as { line1?: string }).line1 || '',
      address_line_2: addr.address_line_2 ?? (addr as { line2?: string | null }).line2 ?? null,
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || (addr as { pincode?: string }).pincode || '',
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
