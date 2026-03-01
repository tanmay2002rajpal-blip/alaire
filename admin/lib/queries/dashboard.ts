'use server';

import { getOrdersCollection, getProductVariantsCollection, getUsersCollection, getActivityLogCollection } from '@/lib/db/collections'

// Types for return values
export interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  pendingOrdersCount: number;
  lowStockCount: number;
  newCustomersThisWeek: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  customer: {
    name: string;
  } | null;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_name: string;
}

/**
 * Get dashboard statistics including revenue, orders, stock, and customers
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const ordersCol = await getOrdersCollection()
    const variantsCol = await getProductVariantsCollection()
    const usersCol = await getUsersCollection()

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get yesterday's date range
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Get date 7 days ago
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [todayOrders, yesterdayOrders, pendingCount, lowStockCount, newCustomersCount] = await Promise.all([
      ordersCol.find(
        { created_at: { $gte: today, $lt: tomorrow } },
        { projection: { total: 1 } }
      ).toArray(),
      ordersCol.find(
        { created_at: { $gte: yesterday, $lt: today } },
        { projection: { total: 1 } }
      ).toArray(),
      ordersCol.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      variantsCol.countDocuments({ is_active: true, stock_quantity: { $lt: 10 } }),
      usersCol.countDocuments({ created_at: { $gte: weekAgo } }),
    ])

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.total || 0), 0)

    return {
      todayRevenue,
      yesterdayRevenue,
      pendingOrdersCount: pendingCount,
      lowStockCount,
      newCustomersThisWeek: newCustomersCount,
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    return {
      todayRevenue: 0,
      yesterdayRevenue: 0,
      pendingOrdersCount: 0,
      lowStockCount: 0,
      newCustomersThisWeek: 0,
    }
  }
}

/**
 * Get recent orders with customer information
 */
export async function getRecentOrders(limit = 5): Promise<RecentOrder[]> {
  try {
    const ordersCol = await getOrdersCollection()
    const usersCol = await getUsersCollection()

    const orders = await ordersCol.find(
      {},
      { projection: { order_number: 1, total: 1, status: 1, created_at: 1, user_id: 1, shipping_address: 1 } }
    ).sort({ created_at: -1 }).limit(limit).toArray()

    if (orders.length === 0) return []

    // Get user profiles
    const userIds = [...new Set(orders.filter(o => o.user_id != null).map(o => o.user_id))]
    const profiles = userIds.length > 0
      ? await usersCol.find(
          { _id: { $in: userIds } },
          { projection: { full_name: 1 } }
        ).toArray()
      : []

    const profileMap = new Map(profiles.map(p => [p._id.toString(), p]))

    return orders.map(order => {
      const userId = order.user_id?.toString() || null
      const profile = userId ? profileMap.get(userId) : null
      const shippingAddr = order.shipping_address || {}
      const createdAt = order.created_at instanceof Date
        ? order.created_at.toISOString()
        : String(order.created_at)

      return {
        id: order._id.toString(),
        order_number: order.order_number,
        total: order.total || 0,
        status: order.status,
        created_at: createdAt,
        customer: {
          name: profile?.full_name || shippingAddr.full_name || 'Unknown',
        },
      }
    })
  } catch (error) {
    console.error('Error in getRecentOrders:', error)
    return []
  }
}

/**
 * Get revenue chart data for the specified number of days
 */
export async function getRevenueChart(days = 7): Promise<RevenueChartData[]> {
  try {
    const ordersCol = await getOrdersCollection()

    // Calculate date range
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0)

    const orders = await ordersCol.find(
      { created_at: { $gte: startDate, $lte: endDate } },
      { projection: { total: 1, created_at: 1 } }
    ).sort({ created_at: 1 }).toArray()

    // Group orders by date
    const revenueByDate = new Map<string, { revenue: number; orders: number }>()

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      revenueByDate.set(dateKey, { revenue: 0, orders: 0 })
    }

    // Aggregate order data
    for (const order of orders) {
      const dateKey = (order.created_at instanceof Date
        ? order.created_at.toISOString()
        : String(order.created_at)).split('T')[0]
      const current = revenueByDate.get(dateKey)
      if (current) {
        current.revenue += order.total || 0
        current.orders += 1
      }
    }

    return Array.from(revenueByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dateKey, data]) => ({
        date: formatDate(dateKey),
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders,
      }))
  } catch (error) {
    console.error('Error in getRevenueChart:', error)
    return []
  }
}

/**
 * Get recent activity log entries
 */
export async function getRecentActivity(limit = 10): Promise<ActivityLogEntry[]> {
  try {
    const activityCol = await getActivityLogCollection()

    const activities = await activityCol.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    return activities.map(activity => ({
      id: activity._id.toString(),
      action: activity.action,
      entity_type: activity.entity_type || '',
      entity_id: activity.entity_id || '',
      details: activity.details,
      created_at: activity.created_at instanceof Date ? activity.created_at.toISOString() : String(activity.created_at),
      admin_name: activity.admin_name || 'System',
    }))
  } catch (error) {
    console.error('Error in getRecentActivity:', error)
    return []
  }
}

/**
 * Helper function to format date strings
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const month = date.toLocaleString('default', { month: 'short' })
  const day = date.getDate()
  return `${month} ${day}`
}
