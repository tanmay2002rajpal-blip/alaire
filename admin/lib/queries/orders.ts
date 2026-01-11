import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  // Build base query - join with profiles for customer info
  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      user_id,
      total,
      subtotal,
      discount_amount,
      shipping_cost,
      status,
      shipping_address,
      razorpay_order_id,
      razorpay_payment_id,
      created_at,
      profiles (
        id,
        full_name,
        phone
      )
    `, { count: 'exact' });

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  // Apply date range filters
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  // Apply search filter (order_number only - can't search profiles directly)
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.ilike('order_number', searchTerm);
  }

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: ordersData, error: ordersError, count } = await query;

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    throw new Error('Failed to fetch orders');
  }

  // Get items count for each order
  const orderIds = ordersData?.map(order => order.id) || [];

  let itemsCountMap: Record<string, number> = {};
  if (orderIds.length > 0) {
    const { data: itemsCount, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items count:', itemsError);
    }

    // Count items per order
    itemsCountMap = (itemsCount || []).reduce((acc, item) => {
      acc[item.order_id] = (acc[item.order_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Transform data
  const orders: Order[] = (ordersData || []).map(order => {
    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
    const shippingAddr = order.shipping_address || {};

    return {
      id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      discount_amount: order.discount_amount || 0,
      shipping_cost: order.shipping_cost || 0,
      status: order.status,
      shipping_address: order.shipping_address,
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      created_at: order.created_at,
      // Get customer info from profile or shipping address
      customer_name: profile?.full_name || shippingAddr.full_name || 'Unknown',
      customer_email: shippingAddr.email || '',
      customer_phone: profile?.phone || shippingAddr.phone || null,
      items_count: itemsCountMap[order.id] || 0,
    };
  });

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    orders,
    total,
    page,
    totalPages,
  };
}

/**
 * Get single order with full details
 */
export async function getOrderById(id: string): Promise<OrderDetail | null> {
  const supabase = await createClient();

  // Get order with customer profile
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      user_id,
      total,
      subtotal,
      discount_amount,
      shipping_cost,
      status,
      shipping_address,
      razorpay_order_id,
      razorpay_payment_id,
      created_at,
      profiles (
        id,
        full_name,
        phone
      )
    `)
    .eq('id', id)
    .single();

  if (orderError || !orderData) {
    console.error('Error fetching order:', orderError);
    return null;
  }

  // Get order items
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      product_id,
      variant_id,
      quantity,
      price_at_purchase,
      product_name,
      variant_name,
      image_url
    `)
    .eq('order_id', id);

  if (itemsError) {
    console.error('Error fetching order items:', itemsError);
  }

  // Get order status history
  const { data: historyData, error: historyError } = await supabase
    .from('order_status_history')
    .select(`
      id,
      order_id,
      status,
      note,
      created_by,
      created_at
    `)
    .eq('order_id', id)
    .order('created_at', { ascending: false });

  if (historyError) {
    console.error('Error fetching order status history:', historyError);
  }

  // Transform order items
  const items: OrderItem[] = (itemsData || []).map(item => ({
    id: item.id,
    order_id: item.order_id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    price_at_purchase: item.price_at_purchase,
    product_name: item.product_name || 'Unknown Product',
    variant_name: item.variant_name,
    image_url: item.image_url,
  }));

  // Transform status history
  const status_history: OrderStatusHistory[] = (historyData || []).map(history => ({
    id: history.id,
    order_id: history.order_id,
    status: history.status,
    note: history.note,
    created_by: history.created_by,
    created_at: history.created_at,
    admin_name: null, // Admin name lookup not implemented yet
  }));

  // Handle profile join
  const profile = Array.isArray(orderData.profiles) ? orderData.profiles[0] : orderData.profiles;
  const shippingAddr = orderData.shipping_address || {};

  return {
    id: orderData.id,
    order_number: orderData.order_number,
    user_id: orderData.user_id,
    total: orderData.total || 0,
    subtotal: orderData.subtotal || 0,
    discount_amount: orderData.discount_amount || 0,
    shipping_cost: orderData.shipping_cost || 0,
    status: orderData.status,
    shipping_address: orderData.shipping_address,
    razorpay_order_id: orderData.razorpay_order_id,
    razorpay_payment_id: orderData.razorpay_payment_id,
    created_at: orderData.created_at,
    customer: {
      id: profile?.id || orderData.user_id,
      name: profile?.full_name || shippingAddr.full_name || 'Unknown',
      email: shippingAddr.email || '',
      phone: profile?.phone || shippingAddr.phone || null,
    },
    items,
    status_history,
  };
}

/**
 * Get order statistics
 */
export async function getOrderStats(): Promise<OrderStats> {
  const supabase = await createClient();

  // Get total orders count
  const { count: totalOrders, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error fetching total orders count:', countError);
  }

  // Get counts by status
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  const statusCounts: Record<string, number> = {};

  for (const status of statuses) {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (error) {
      console.error(`Error fetching ${status} orders count:`, error);
      statusCounts[status] = 0;
    } else {
      statusCounts[status] = count || 0;
    }
  }

  // Get total revenue (sum of all completed orders)
  const { data: revenueData, error: revenueError } = await supabase
    .from('orders')
    .select('total')
    .in('status', ['delivered', 'shipped', 'processing', 'confirmed']);

  if (revenueError) {
    console.error('Error fetching revenue:', revenueError);
  }

  const totalRevenue = (revenueData || []).reduce((sum, order) => sum + (order.total || 0), 0);

  return {
    total_orders: totalOrders || 0,
    pending: statusCounts.pending || 0,
    confirmed: statusCounts.confirmed || 0,
    processing: statusCounts.processing || 0,
    shipped: statusCounts.shipped || 0,
    delivered: statusCounts.delivered || 0,
    cancelled: statusCounts.cancelled || 0,
    refunded: statusCounts.refunded || 0,
    total_revenue: totalRevenue,
  };
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
  const supabase = await createClient();

  try {
    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return { success: false, error: 'Failed to update order status' };
    }

    // Insert into order_status_history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status,
        note: note || null,
        created_by: adminId || null,
      });

    if (historyError) {
      console.error('Error inserting status history:', historyError);
      return { success: false, error: 'Failed to log status change' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating order status:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
