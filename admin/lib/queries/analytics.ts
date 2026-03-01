/**
 * @fileoverview Analytics queries for admin dashboard.
 * Provides sales metrics, trends, and reports.
 */

import { getOrdersCollection, getOrderItemsCollection, getProductsCollection, getCategoriesCollection, getUsersCollection } from '@/lib/db/collections'

export interface SalesStats {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  totalUnitsSold: number
  revenueGrowth: number
  ordersGrowth: number
}

export interface DailySales {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  id: string
  name: string
  imageUrl: string | null
  unitsSold: number
  revenue: number
}

export interface TopCategory {
  id: string
  name: string
  unitsSold: number
  revenue: number
  percentage: number
}

export interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

/**
 * Get overall sales statistics
 */
export async function getSalesStats(): Promise<SalesStats> {
  const ordersCol = await getOrdersCollection()
  const orderItemsCol = await getOrderItemsCollection()

  const validStatuses = ['paid', 'confirmed', 'processing', 'shipped', 'delivered']

  // Get all-time stats
  const orders = await ordersCol.find(
    { status: { $in: validStatuses } },
    { projection: { total: 1, created_at: 1 } }
  ).toArray()

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Get units sold
  const unitsResult = await orderItemsCol.aggregate<{ _id: null; total: number }>([
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]).toArray()
  const totalUnitsSold = unitsResult[0]?.total || 0

  // Calculate growth (this month vs last month)
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const thisMonthRevenue = orders
    .filter(o => o.created_at >= thisMonthStart)
    .reduce((sum, o) => sum + (o.total || 0), 0)

  const lastMonthRevenue = orders
    .filter(o => o.created_at >= lastMonthStart && o.created_at <= lastMonthEnd)
    .reduce((sum, o) => sum + (o.total || 0), 0)

  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : thisMonthRevenue > 0 ? 100 : 0

  const thisMonthOrders = orders.filter(o => o.created_at >= thisMonthStart).length
  const lastMonthOrders = orders.filter(o => o.created_at >= lastMonthStart && o.created_at <= lastMonthEnd).length

  const ordersGrowth = lastMonthOrders > 0
    ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
    : thisMonthOrders > 0 ? 100 : 0

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    totalUnitsSold,
    revenueGrowth,
    ordersGrowth,
  }
}

/**
 * Get daily sales for the last N days
 */
export async function getDailySales(days: number = 30): Promise<DailySales[]> {
  const ordersCol = await getOrdersCollection()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const validStatuses = ['paid', 'confirmed', 'processing', 'shipped', 'delivered']

  const orders = await ordersCol.find(
    {
      status: { $in: validStatuses },
      created_at: { $gte: startDate },
    },
    { projection: { total: 1, created_at: 1 } }
  ).sort({ created_at: 1 }).toArray()

  // Group by date
  const salesByDate: Record<string, DailySales> = {}

  // Initialize all dates with 0
  for (let i = 0; i <= days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    const dateStr = date.toISOString().split("T")[0]
    salesByDate[dateStr] = { date: dateStr, revenue: 0, orders: 0 }
  }

  // Aggregate orders
  for (const order of orders) {
    const dateStr = order.created_at.toISOString().split("T")[0]
    if (salesByDate[dateStr]) {
      salesByDate[dateStr].revenue += order.total || 0
      salesByDate[dateStr].orders += 1
    }
  }

  return Object.values(salesByDate)
}

/**
 * Get top selling products
 */
export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  const orderItemsCol = await getOrderItemsCollection()

  const results = await orderItemsCol.aggregate<{
    _id: string
    name: string
    imageUrl: string | null
    unitsSold: number
    revenue: number
  }>([
    { $match: { product_id: { $ne: null } } },
    {
      $group: {
        _id: { $toString: '$product_id' },
        name: { $first: '$product_name' },
        imageUrl: { $first: '$image_url' },
        unitsSold: { $sum: '$quantity' },
        revenue: { $sum: { $multiply: ['$quantity', '$price_at_purchase'] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
  ]).toArray()

  return results.map(r => ({
    id: r._id,
    name: r.name,
    imageUrl: r.imageUrl,
    unitsSold: r.unitsSold,
    revenue: r.revenue,
  }))
}

/**
 * Get sales by category
 */
export async function getSalesByCategory(): Promise<TopCategory[]> {
  const orderItemsCol = await getOrderItemsCollection()
  const productsCol = await getProductsCollection()
  const categoriesCol = await getCategoriesCollection()

  const orderItems = await orderItemsCol.find(
    { product_id: { $ne: null } },
    { projection: { product_id: 1, quantity: 1, price_at_purchase: 1 } }
  ).toArray()

  if (orderItems.length === 0) return []

  // Get product categories
  const productIds = [...new Set(orderItems.map(i => i.product_id).filter(Boolean))]
  const products = await productsCol.find(
    { _id: { $in: productIds as any } },
    { projection: { category_id: 1 } }
  ).toArray()

  const categories = await categoriesCol.find(
    {},
    { projection: { name: 1 } }
  ).toArray()

  // Create lookup maps
  const productCategoryMap = new Map(products.map(p => [p._id.toString(), p.category_id?.toString()]))
  const categoryNameMap = new Map(categories.map(c => [c._id.toString(), c.name]))

  // Aggregate by category
  const categoryMap: Record<string, TopCategory> = {}
  let totalRevenue = 0

  for (const item of orderItems) {
    if (!item.product_id) continue

    const categoryId = productCategoryMap.get(item.product_id.toString())
    if (!categoryId) continue

    const revenue = (item.quantity || 0) * (item.price_at_purchase || 0)
    totalRevenue += revenue

    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = {
        id: categoryId,
        name: categoryNameMap.get(categoryId) || "Unknown",
        unitsSold: 0,
        revenue: 0,
        percentage: 0,
      }
    }

    categoryMap[categoryId].unitsSold += item.quantity || 0
    categoryMap[categoryId].revenue += revenue
  }

  return Object.values(categoryMap)
    .map(cat => ({
      ...cat,
      percentage: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

/**
 * Get recent orders
 */
export async function getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
  const ordersCol = await getOrdersCollection()
  const usersCol = await getUsersCollection()

  const orders = await ordersCol.find(
    {},
    { projection: { order_number: 1, total: 1, status: 1, created_at: 1, user_id: 1 } }
  ).sort({ created_at: -1 }).limit(limit).toArray()

  if (orders.length === 0) return []

  // Get customer profiles
  const userIds = [...new Set(orders.map(o => o.user_id))]
  const profiles = await usersCol.find(
    { _id: { $in: userIds } },
    { projection: { full_name: 1, email: 1 } }
  ).toArray()

  const profileMap = new Map(profiles.map(p => [p._id.toString(), p]))

  return orders.map(order => {
    const profile = profileMap.get(order.user_id.toString())
    return {
      id: order._id.toString(),
      orderNumber: order.order_number,
      customerName: profile?.full_name || profile?.email || "Guest",
      total: order.total,
      status: order.status,
      createdAt: order.created_at.toISOString(),
    }
  })
}

/**
 * Get sales by payment method
 */
export async function getSalesByPaymentMethod(): Promise<{ method: string; count: number; revenue: number }[]> {
  const ordersCol = await getOrdersCollection()

  const validStatuses = ['paid', 'confirmed', 'processing', 'shipped', 'delivered']

  const results = await ordersCol.aggregate<{ _id: string | null; count: number; revenue: number }>([
    { $match: { status: { $in: validStatuses } } },
    {
      $group: {
        _id: '$payment_method',
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
  ]).toArray()

  // Ensure both payment methods are represented
  const methodMap: Record<string, { count: number; revenue: number }> = {
    prepaid: { count: 0, revenue: 0 },
    cod: { count: 0, revenue: 0 },
  }

  for (const r of results) {
    const method = r._id || 'prepaid'
    if (!methodMap[method]) {
      methodMap[method] = { count: 0, revenue: 0 }
    }
    methodMap[method].count += r.count
    methodMap[method].revenue += r.revenue
  }

  return Object.entries(methodMap).map(([method, data]) => ({
    method: method === "cod" ? "Cash on Delivery" : "Online Payment",
    ...data,
  }))
}
