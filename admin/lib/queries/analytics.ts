/**
 * @fileoverview Analytics queries for admin dashboard.
 * Provides sales metrics, trends, and reports.
 */

import { ObjectId } from 'mongodb'
import { getOrdersCollection, getProductsCollection, getCategoriesCollection, getUsersCollection } from '@/lib/db/collections'
import { getDb } from '@/lib/db/client'

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

  const validStatuses = ['paid', 'confirmed', 'processing', 'shipped', 'delivered']

  // Get all-time stats
  const orders = await ordersCol.find(
    { status: { $in: validStatuses } },
    { projection: { total: 1, created_at: 1 } }
  ).toArray()

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Get units sold — count only items belonging to revenue-valid orders so the
  // number stays consistent with the status-filtered revenue above.
  const unitsResult = await ordersCol.aggregate<{ _id: null; total: number }>([
    { $match: { status: { $in: validStatuses } } },
    {
      $lookup: {
        from: 'order_items',
        localField: '_id',
        foreignField: 'order_id',
        as: 'items',
      },
    },
    { $unwind: '$items' },
    { $group: { _id: null, total: { $sum: '$items.quantity' } } },
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

  // Query a little earlier than the display window so timezone-shifted orders
  // near the boundary are not dropped; buckets below limit the visible range.
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const validStatuses = ['paid', 'confirmed', 'processing', 'shipped', 'delivered']

  // Bucket by IST calendar day (+05:30) directly in Mongo so revenue lands on
  // the correct local date instead of drifting to the UTC day.
  const results = await ordersCol.aggregate<{ _id: string; revenue: number; orders: number }>([
    {
      $match: {
        status: { $in: validStatuses },
        created_at: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at', timezone: '+05:30' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
  ]).toArray()

  const resultMap = new Map(results.map(r => [r._id, r]))

  // Build exactly `days` buckets ending today, keyed by IST calendar date.
  const istFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })
  const salesByDate: DailySales[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = istFormatter.format(date)
    const r = resultMap.get(dateStr)
    salesByDate.push({ date: dateStr, revenue: r?.revenue || 0, orders: r?.orders || 0 })
  }

  return salesByDate
}

/**
 * Get top selling products
 */
export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  const ordersCol = await getOrdersCollection()

  const validStatuses = ['paid', 'confirmed', 'processing', 'shipped', 'delivered']

  // Start from revenue-valid orders, then join order_items so cancelled/refunded
  // orders do not inflate units/revenue (shared valid-status set).
  const results = await ordersCol.aggregate<{
    _id: string
    name: string
    imageUrl: string | null
    unitsSold: number
    revenue: number
  }>([
    { $match: { status: { $in: validStatuses } } },
    {
      $lookup: {
        from: 'order_items',
        localField: '_id',
        foreignField: 'order_id',
        as: 'items',
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.product_id': { $ne: null } } },
    {
      $group: {
        _id: { $toString: '$items.product_id' },
        name: { $first: '$items.product_name' },
        imageUrl: { $first: '$items.image_url' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.price_at_purchase'] } },
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
  const ordersCol = await getOrdersCollection()
  const productsCol = await getProductsCollection()
  const categoriesCol = await getCategoriesCollection()

  const validStatuses = ['paid', 'confirmed', 'processing', 'shipped', 'delivered']

  // Only count items from revenue-valid orders (shared valid-status set) so
  // cancelled/refunded orders do not inflate category units/revenue.
  const orderItems = await ordersCol.aggregate<{
    product_id: unknown
    quantity: number
    price_at_purchase: number
  }>([
    { $match: { status: { $in: validStatuses } } },
    {
      $lookup: {
        from: 'order_items',
        localField: '_id',
        foreignField: 'order_id',
        as: 'items',
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.product_id': { $ne: null } } },
    {
      $project: {
        _id: 0,
        product_id: '$items.product_id',
        quantity: '$items.quantity',
        price_at_purchase: '$items.price_at_purchase',
      },
    },
  ]).toArray()

  if (orderItems.length === 0) return []

  // Get product categories. order_items.product_id is stored as a string, so
  // convert to ObjectId (guarding against invalid ids) before matching _id.
  const productIds = [...new Set(orderItems.map(i => i.product_id?.toString()).filter(Boolean))] as string[]
  const productObjectIds = productIds
    .filter(id => ObjectId.isValid(id))
    .map(id => new ObjectId(id))
  const products = await productsCol.find(
    { _id: { $in: productObjectIds } },
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
  const userIds = [...new Set(orders.filter(o => o.user_id != null).map(o => o.user_id))]
  const profiles = userIds.length > 0
    ? await usersCol.find(
        { _id: { $in: userIds } },
        { projection: { full_name: 1, email: 1 } }
      ).toArray()
    : []

  const profileMap = new Map(profiles.map(p => [p._id.toString(), p]))

  return orders.map(order => {
    const userId = order.user_id?.toString() || null
    const profile = userId ? profileMap.get(userId) : null
    const createdAt = order.created_at instanceof Date
      ? order.created_at.toISOString()
      : String(order.created_at)
    return {
      id: order._id.toString(),
      orderNumber: order.order_number,
      customerName: profile?.full_name || profile?.email || order.shipping_address?.full_name || "Guest",
      total: order.total,
      status: order.status,
      createdAt: createdAt,
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

export async function getBestSellerProducts(limit = 10): Promise<{
  id: string
  name: string
  slug: string
  images: string[]
  category_name: string | null
  total_units: number
  total_revenue: number
  variant_count: number
}[]> {
  const db = await getDb()

  const pipeline = [
    // Join with orders to get revenue-valid orders only (shared valid-status set)
    {
      $match: {
        status: { $in: ["paid", "confirmed", "processing", "shipped", "delivered"] }
      }
    },
    // Unwind order items
    {
      $lookup: {
        from: "order_items",
        localField: "_id",
        foreignField: "order_id",
        as: "items"
      }
    },
    { $unwind: "$items" },
    // Group by product
    {
      $group: {
        _id: "$items.product_id",
        total_units: { $sum: "$items.quantity" },
        total_revenue: { $sum: { $multiply: ["$items.price_at_purchase", "$items.quantity"] } }
      }
    },
    { $sort: { total_units: -1 } },
    { $limit: limit },
  ]

  const salesData = await db.collection("orders").aggregate(pipeline).toArray()

  if (salesData.length === 0) return []

  // Fetch product details for these IDs
  const productIds = salesData.map(s => {
    try { return new ObjectId(s._id as string) } catch { return null }
  }).filter(Boolean)

  const products = await db.collection("products").aggregate([
    { $match: { _id: { $in: productIds } } },
    {
      $lookup: {
        from: "categories",
        let: { catId: "$category_id" },
        pipeline: [
          // category_id may be stored as ObjectId or string; compare as strings on both sides
          { $match: { $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$catId" }] } } }
        ],
        as: "categoryArr"
      }
    },
    {
      $lookup: {
        from: "product_variants",
        localField: "_id",
        foreignField: "product_id",
        as: "variants"
      }
    },
    {
      $addFields: {
        category: { $arrayElemAt: ["$categoryArr", 0] }
      }
    }
  ]).toArray()

  // Merge sales data with product details
  return salesData.map(sale => {
    const product = products.find(p => p._id.toString() === (sale._id as string))
    if (!product) return null
    return {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      images: product.images || [],
      category_name: product.category?.name || null,
      total_units: sale.total_units,
      total_revenue: sale.total_revenue,
      variant_count: (product.variants || []).length,
    }
  }).filter(Boolean) as any[]
}

export async function getProductVariantSales(productId: string): Promise<{
  variant_id: string
  variant_name: string
  options: Record<string, string>
  units_sold: number
  revenue: number
  stock_remaining: number
  price: number
}[]> {
  const db = await getDb()

  // Get all variants for this product. product_variants.product_id is stored as
  // an ObjectId, so convert the incoming string id (guarding invalid ids).
  const variants = ObjectId.isValid(productId)
    ? await db.collection("product_variants")
        .find({ product_id: new ObjectId(productId) })
        .toArray()
    : []

  if (variants.length === 0) return []

  // Get sales data per variant from order_items
  const variantSales = await db.collection("orders").aggregate([
    {
      $match: {
        status: { $in: ["paid", "confirmed", "processing", "shipped", "delivered"] }
      }
    },
    {
      $lookup: {
        from: "order_items",
        localField: "_id",
        foreignField: "order_id",
        as: "items"
      }
    },
    { $unwind: "$items" },
    {
      $match: {
        "items.product_id": productId
      }
    },
    {
      $group: {
        _id: "$items.variant_id",
        units_sold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price_at_purchase", "$items.quantity"] } }
      }
    },
    { $sort: { units_sold: -1 } }
  ]).toArray()

  // Merge variant details with sales data
  return variants.map(variant => {
    const sales = variantSales.find(s => (s._id as string) === variant._id.toString())
    return {
      variant_id: variant._id.toString(),
      variant_name: variant.name,
      options: variant.options || {},
      units_sold: sales?.units_sold || 0,
      revenue: sales?.revenue || 0,
      stock_remaining: variant.stock_quantity || 0,
      price: variant.price || 0,
    }
  }).sort((a, b) => b.units_sold - a.units_sold)
}
