'use server';

import { createClient } from '@/lib/supabase/server';

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
  details: Record<string, any> | null;
  created_at: string;
  admin_name: string;
}

/**
 * Get dashboard statistics including revenue, orders, stock, and customers
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient();

    // Get today's date range (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString();

    // Get yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = yesterday.toISOString();
    const yesterdayEnd = todayStart;

    // Get date 7 days ago
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStart = weekAgo.toISOString();

    // Fetch today's revenue
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd);

    if (todayError) {
      console.error('Error fetching today revenue:', todayError);
    }

    const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Fetch yesterday's revenue
    const { data: yesterdayOrders, error: yesterdayError } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', yesterdayStart)
      .lt('created_at', yesterdayEnd);

    if (yesterdayError) {
      console.error('Error fetching yesterday revenue:', yesterdayError);
    }

    const yesterdayRevenue = yesterdayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Fetch pending orders count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing']);

    if (pendingError) {
      console.error('Error fetching pending orders:', pendingError);
    }

    const pendingOrdersCount = pendingCount || 0;

    // Fetch low stock count from product_variants (stock_quantity < 10)
    const { count: lowStockCount, error: lowStockError } = await supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true })
      .lt('stock_quantity', 10)
      .eq('is_active', true);

    if (lowStockError) {
      console.error('Error fetching low stock:', lowStockError);
    }

    // Fetch new customers this week from profiles table
    const { count: newCustomersCount, error: customersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgoStart);

    if (customersError) {
      console.error('Error fetching new customers:', customersError);
    }

    const newCustomersThisWeek = newCustomersCount || 0;

    return {
      todayRevenue,
      yesterdayRevenue,
      pendingOrdersCount,
      lowStockCount: lowStockCount || 0,
      newCustomersThisWeek,
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return {
      todayRevenue: 0,
      yesterdayRevenue: 0,
      pendingOrdersCount: 0,
      lowStockCount: 0,
      newCustomersThisWeek: 0,
    };
  }
}

/**
 * Get recent orders with customer information
 */
export async function getRecentOrders(limit = 5): Promise<RecentOrder[]> {
  try {
    const supabase = await createClient();

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        status,
        created_at,
        user_id,
        shipping_address,
        profiles (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }

    // Transform the data to match our interface
    return (orders || []).map(order => {
      const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
      const shippingAddr = order.shipping_address as any || {};

      return {
        id: order.id,
        order_number: order.order_number,
        total: order.total || 0,
        status: order.status,
        created_at: order.created_at,
        customer: {
          name: profile?.full_name || shippingAddr.full_name || 'Unknown',
        },
      };
    });
  } catch (error) {
    console.error('Error in getRecentOrders:', error);
    return [];
  }
}

/**
 * Get revenue chart data for the specified number of days
 */
export async function getRevenueChart(days = 7): Promise<RevenueChartData[]> {
  try {
    const supabase = await createClient();

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // Fetch orders within date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching revenue chart data:', error);
      return [];
    }

    // Group orders by date
    const revenueByDate = new Map<string, { revenue: number; orders: number }>();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      revenueByDate.set(dateKey, { revenue: 0, orders: 0 });
    }

    // Aggregate order data
    (orders || []).forEach(order => {
      const dateKey = order.created_at.split('T')[0];
      const current = revenueByDate.get(dateKey);
      if (current) {
        current.revenue += order.total || 0;
        current.orders += 1;
      }
    });

    // Convert to array and format dates - sort by original date key first, then format
    return Array.from(revenueByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort by ISO date string (YYYY-MM-DD)
      .map(([dateKey, data]) => ({
        date: formatDate(dateKey),
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders,
      }));
  } catch (error) {
    console.error('Error in getRevenueChart:', error);
    return [];
  }
}

/**
 * Get recent activity log entries
 */
export async function getRecentActivity(limit = 10): Promise<ActivityLogEntry[]> {
  try {
    const supabase = await createClient();

    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('id, action, entity_type, entity_id, details, created_at, admin_name')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity log:', error);
      return [];
    }

    return (activities || []).map(activity => ({
      id: activity.id,
      action: activity.action,
      entity_type: activity.entity_type || '',
      entity_id: activity.entity_id || '',
      details: activity.details,
      created_at: activity.created_at,
      admin_name: activity.admin_name || 'System',
    }));
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    return [];
  }
}

/**
 * Helper function to format date strings
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}
