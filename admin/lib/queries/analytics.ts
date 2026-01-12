/**
 * @fileoverview Analytics queries for admin dashboard.
 * Provides sales metrics, trends, and reports.
 */

import { createClient } from "@/lib/supabase/server"

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
  const supabase = await createClient()

  // Get all-time stats
  const { data: orders } = await supabase
    .from("orders")
    .select("total, created_at")
    .in("status", ["paid", "confirmed", "processing", "shipped", "delivered"])

  const allOrders = orders || []
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalOrders = allOrders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Get units sold
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("quantity")

  const totalUnitsSold = (orderItems || []).reduce((sum, i) => sum + (i.quantity || 0), 0)

  // Calculate growth (this month vs last month)
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

  const thisMonthRevenue = allOrders
    .filter(o => o.created_at >= thisMonthStart)
    .reduce((sum, o) => sum + (o.total || 0), 0)

  const lastMonthRevenue = allOrders
    .filter(o => o.created_at >= lastMonthStart && o.created_at <= lastMonthEnd)
    .reduce((sum, o) => sum + (o.total || 0), 0)

  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : thisMonthRevenue > 0 ? 100 : 0

  const thisMonthOrders = allOrders.filter(o => o.created_at >= thisMonthStart).length
  const lastMonthOrders = allOrders.filter(o => o.created_at >= lastMonthStart && o.created_at <= lastMonthEnd).length

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
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: orders } = await supabase
    .from("orders")
    .select("total, created_at")
    .in("status", ["paid", "confirmed", "processing", "shipped", "delivered"])
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true })

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
  for (const order of orders || []) {
    const dateStr = order.created_at.split("T")[0]
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
  const supabase = await createClient()

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, product_name, image_url, quantity, price_at_purchase")

  // Aggregate by product
  const productMap: Record<string, TopProduct> = {}

  for (const item of orderItems || []) {
    if (!item.product_id) continue

    if (!productMap[item.product_id]) {
      productMap[item.product_id] = {
        id: item.product_id,
        name: item.product_name,
        imageUrl: item.image_url,
        unitsSold: 0,
        revenue: 0,
      }
    }

    productMap[item.product_id].unitsSold += item.quantity || 0
    productMap[item.product_id].revenue += (item.quantity || 0) * (item.price_at_purchase || 0)
  }

  // Sort by units sold and return top N
  return Object.values(productMap)
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit)
}

/**
 * Get sales by category
 */
export async function getSalesByCategory(): Promise<TopCategory[]> {
  const supabase = await createClient()

  // Get order items with product info
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, quantity, price_at_purchase")

  if (!orderItems?.length) return []

  // Get product categories
  const productIds = [...new Set(orderItems.map(i => i.product_id).filter(Boolean))]

  const { data: products } = await supabase
    .from("products")
    .select("id, category_id")
    .in("id", productIds)

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")

  // Create lookup maps
  const productCategoryMap: Record<string, string> = {}
  for (const product of products || []) {
    productCategoryMap[product.id] = product.category_id
  }

  const categoryNameMap: Record<string, string> = {}
  for (const category of categories || []) {
    categoryNameMap[category.id] = category.name
  }

  // Aggregate by category
  const categoryMap: Record<string, TopCategory> = {}
  let totalRevenue = 0

  for (const item of orderItems) {
    if (!item.product_id) continue

    const categoryId = productCategoryMap[item.product_id]
    if (!categoryId) continue

    const revenue = (item.quantity || 0) * (item.price_at_purchase || 0)
    totalRevenue += revenue

    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = {
        id: categoryId,
        name: categoryNameMap[categoryId] || "Unknown",
        unitsSold: 0,
        revenue: 0,
        percentage: 0,
      }
    }

    categoryMap[categoryId].unitsSold += item.quantity || 0
    categoryMap[categoryId].revenue += revenue
  }

  // Calculate percentages
  const result = Object.values(categoryMap)
    .map(cat => ({
      ...cat,
      percentage: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return result
}

/**
 * Get recent orders
 */
export async function getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      total,
      status,
      created_at,
      user_id
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!orders?.length) return []

  // Get customer profiles
  const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))]

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds)

  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}
  for (const profile of profiles || []) {
    profileMap[profile.id] = profile
  }

  return orders.map(order => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: profileMap[order.user_id]?.full_name || profileMap[order.user_id]?.email || "Guest",
    total: order.total,
    status: order.status,
    createdAt: order.created_at,
  }))
}

/**
 * Get sales by payment method
 */
export async function getSalesByPaymentMethod(): Promise<{ method: string; count: number; revenue: number }[]> {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from("orders")
    .select("payment_method, total")
    .in("status", ["paid", "confirmed", "processing", "shipped", "delivered"])

  const methodMap: Record<string, { count: number; revenue: number }> = {
    prepaid: { count: 0, revenue: 0 },
    cod: { count: 0, revenue: 0 },
  }

  for (const order of orders || []) {
    const method = order.payment_method || "prepaid"
    if (!methodMap[method]) {
      methodMap[method] = { count: 0, revenue: 0 }
    }
    methodMap[method].count += 1
    methodMap[method].revenue += order.total || 0
  }

  return Object.entries(methodMap).map(([method, data]) => ({
    method: method === "cod" ? "Cash on Delivery" : "Online Payment",
    ...data,
  }))
}
