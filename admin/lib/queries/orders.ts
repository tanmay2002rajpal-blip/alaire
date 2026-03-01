import { ObjectId } from 'mongodb'
import { getOrdersCollection, getOrderItemsCollection, getOrderStatusHistoryCollection, getUsersCollection } from '@/lib/db/collections'
import { toObjectId, paginate, totalPages } from '@/lib/db/helpers'

// Types
export interface OrderFilters {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total: number;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  status: string;
  shipping_address: any;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items_count: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  price_at_purchase: number;
  product_name: string;
  variant_name: string | null;
  image_url: string | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
  admin_name: string | null;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  user_id: string;
  total: number;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  status: string;
  payment_method: string | null;
  shipping_address: any;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  items: OrderItem[];
  status_history: OrderStatusHistory[];
}

export interface OrderStats {
  total_orders: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  total_revenue: number;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Get paginated orders with filters
 */
export async function getOrders(filters?: OrderFilters): Promise<PaginatedOrders> {
  const ordersCol = await getOrdersCollection()
  const orderItemsCol = await getOrderItemsCollection()

  const { skip, limit: lim, page } = paginate(filters?.page, filters?.limit || 20)

  // Build filter
  const filter: Record<string, any> = {}

  if (filters?.status && filters.status !== 'all') {
    filter.status = filters.status
  }

  if (filters?.dateFrom) {
    filter.created_at = { ...filter.created_at, $gte: new Date(filters.dateFrom) }
  }
  if (filters?.dateTo) {
    filter.created_at = { ...filter.created_at, $lte: new Date(filters.dateTo) }
  }

  if (filters?.search) {
    filter.order_number = { $regex: filters.search, $options: 'i' }
  }

  const [ordersData, total] = await Promise.all([
    ordersCol.find(filter).sort({ created_at: -1 }).skip(skip).limit(lim).toArray(),
    ordersCol.countDocuments(filter),
  ])

  // Get user profiles and item counts
  const orderIds = ordersData.map(o => o._id)
  const userIds = [...new Set(ordersData.filter(o => o.user_id != null).map(o => o.user_id))]

  const [profiles, itemsDocs] = await Promise.all([
    (async () => {
      if (userIds.length === 0) return []
      const users = await getUsersCollection()
      return users.find({ _id: { $in: userIds } }, { projection: { full_name: 1, phone: 1 } }).toArray()
    })(),
    orderIds.length > 0
      ? orderItemsCol.find(
          { $or: [
            { order_id: { $in: orderIds } },
            { order_id: { $in: orderIds.map(id => id.toString()) } as any },
          ]},
          { projection: { order_id: 1 } }
        ).toArray()
      : Promise.resolve([]),
  ])

  const profileMap = new Map(profiles.map(p => [p._id.toString(), p]))
  const itemsCountMap: Record<string, number> = {}
  for (const item of itemsDocs) {
    const oid = item.order_id.toString()
    itemsCountMap[oid] = (itemsCountMap[oid] || 0) + 1
  }

  // Transform data
  const orders: Order[] = ordersData.map(order => {
    const userId = order.user_id?.toString() || null
    const profile = userId ? profileMap.get(userId) : null
    const shippingAddr = order.shipping_address || {}
    const createdAt = order.created_at instanceof Date
      ? order.created_at.toISOString()
      : String(order.created_at)

    return {
      id: order._id.toString(),
      order_number: order.order_number,
      user_id: userId || '',
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      discount_amount: order.discount_amount || 0,
      shipping_cost: order.shipping_cost || order.shipping_amount || 0,
      status: order.status,
      shipping_address: order.shipping_address,
      razorpay_order_id: order.razorpay_order_id || null,
      razorpay_payment_id: order.razorpay_payment_id || null,
      created_at: createdAt,
      customer_name: profile?.full_name || shippingAddr.full_name || 'Unknown',
      customer_email: (order as any).email || shippingAddr.email || '',
      customer_phone: profile?.phone || shippingAddr.phone || null,
      items_count: itemsCountMap[order._id.toString()] || 0,
    }
  })

  return {
    orders,
    total,
    page,
    totalPages: totalPages(total, lim),
  }
}

/**
 * Get single order with full details
 */
export async function getOrderById(id: string): Promise<OrderDetail | null> {
  const ordersCol = await getOrdersCollection()
  const orderItemsCol = await getOrderItemsCollection()
  const historyCol = await getOrderStatusHistoryCollection()

  const oid = toObjectId(id)
  const orderData = await ordersCol.findOne({ _id: oid })
  if (!orderData) return null

  // Get items, history, and profile in parallel
  const orderIdStr = oid.toString()
  const [itemsData, historyData, profile] = await Promise.all([
    orderItemsCol.find({ $or: [{ order_id: oid }, { order_id: orderIdStr as any }] }).toArray(),
    historyCol.find({ $or: [{ order_id: oid }, { order_id: orderIdStr as any }] }).sort({ created_at: -1 }).toArray(),
    (async () => {
      if (!orderData.user_id) return null
      const users = await getUsersCollection()
      return users.findOne(
        { _id: orderData.user_id },
        { projection: { full_name: 1, phone: 1 } }
      )
    })(),
  ])

  const shippingAddr = orderData.shipping_address || {}
  const userId = orderData.user_id?.toString() || null

  const items: OrderItem[] = itemsData.map(item => ({
    id: item._id.toString(),
    order_id: item.order_id?.toString() || '',
    product_id: item.product_id?.toString() || null,
    variant_id: item.variant_id?.toString() || null,
    quantity: item.quantity,
    price_at_purchase: item.price_at_purchase ?? (item as any).price ?? 0,
    product_name: item.product_name || 'Unknown Product',
    variant_name: item.variant_name || null,
    image_url: item.image_url || null,
  }))

  const status_history: OrderStatusHistory[] = historyData.map(h => ({
    id: h._id.toString(),
    order_id: h.order_id?.toString() || '',
    status: h.status,
    note: h.note || null,
    created_by: h.created_by?.toString() || null,
    created_at: h.created_at instanceof Date ? h.created_at.toISOString() : String(h.created_at),
    admin_name: null,
  }))

  const createdAt = orderData.created_at instanceof Date
    ? orderData.created_at.toISOString()
    : String(orderData.created_at)

  return {
    id: orderData._id.toString(),
    order_number: orderData.order_number,
    user_id: userId || '',
    total: orderData.total || 0,
    subtotal: orderData.subtotal || 0,
    discount_amount: orderData.discount_amount || 0,
    shipping_cost: orderData.shipping_cost || orderData.shipping_amount || 0,
    status: orderData.status,
    payment_method: orderData.payment_method || null,
    shipping_address: orderData.shipping_address || {},
    razorpay_order_id: orderData.razorpay_order_id || null,
    razorpay_payment_id: orderData.razorpay_payment_id || null,
    created_at: createdAt,
    customer: {
      id: profile?._id.toString() || userId || '',
      name: profile?.full_name || shippingAddr.full_name || 'Unknown',
      email: (orderData as any).email || shippingAddr.email || '',
      phone: profile?.phone || shippingAddr.phone || null,
    },
    items,
    status_history,
  }
}

/**
 * Get order statistics
 */
export async function getOrderStats(): Promise<OrderStats> {
  const ordersCol = await getOrdersCollection()

  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const

  // Run all counts in parallel
  const [totalOrders, ...statusCountResults] = await Promise.all([
    ordersCol.countDocuments(),
    ...statuses.map(status => ordersCol.countDocuments({ status })),
  ])

  const statusCounts: Record<string, number> = {}
  statuses.forEach((status, i) => {
    statusCounts[status] = statusCountResults[i]
  })

  // Get total revenue
  const revenueResult = await ordersCol.aggregate<{ _id: null; total: number }>([
    { $match: { status: { $in: ['delivered', 'shipped', 'processing', 'confirmed'] } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]).toArray()

  return {
    total_orders: totalOrders,
    pending: statusCounts.pending || 0,
    confirmed: statusCounts.confirmed || 0,
    processing: statusCounts.processing || 0,
    shipped: statusCounts.shipped || 0,
    delivered: statusCounts.delivered || 0,
    cancelled: statusCounts.cancelled || 0,
    refunded: statusCounts.refunded || 0,
    total_revenue: revenueResult[0]?.total || 0,
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  note?: string,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  const ordersCol = await getOrdersCollection()
  const historyCol = await getOrderStatusHistoryCollection()

  try {
    const oid = toObjectId(orderId)

    await ordersCol.updateOne(
      { _id: oid },
      { $set: { status, updated_at: new Date() } }
    )

    await historyCol.insertOne({
      _id: new ObjectId(),
      order_id: oid,
      status,
      note: note || null,
      created_by: adminId ? toObjectId(adminId) : null,
      created_at: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating order status:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
