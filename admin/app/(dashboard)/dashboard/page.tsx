import { StatsCards } from '@/components/dashboard/stats-cards';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import {
  getDashboardStats,
  getRecentOrders,
  getRevenueChart,
} from '@/lib/queries/dashboard';
import { getBestSellerProducts } from '@/lib/queries/analytics';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Plus, ShoppingCart, Tag, Package, FileText } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const getStatusBadgeVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'processing':
    case 'shipped':
      return 'outline';
    case 'cancelled':
    case 'refunded':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default async function DashboardPage() {
  // Fetch all dashboard data in parallel
  const [stats, recentOrders, revenueData, topProducts] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(5),
    getRevenueChart(7),
    getBestSellerProducts(5),
  ]);

  // Calculate revenue change percentage
  const revenueChange =
    stats.yesterdayRevenue === 0
      ? stats.todayRevenue > 0
        ? 100
        : 0
      : ((stats.todayRevenue - stats.yesterdayRevenue) /
          stats.yesterdayRevenue) *
        100;

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">
              <ShoppingCart className="h-4 w-4 mr-1" />
              View Orders
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/coupons">
              <Tag className="h-4 w-4 mr-1" />
              Create Coupon
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Full Width */}
      <StatsCards
        todayRevenue={stats.todayRevenue}
        revenueChange={revenueChange}
        pendingOrders={stats.pendingOrdersCount}
        lowStockItems={stats.lowStockCount}
        newCustomers={stats.newCustomersThisWeek}
      />

      {/* Revenue Chart - Full Width */}
      <RevenueChart data={revenueData} />

      {/* Recent Orders Table - Full Width */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription className="mt-1">
                Latest orders from your customers
              </CardDescription>
            </div>
            <Link
              href="/orders"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all orders
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No orders yet. Orders will appear here once customers start
                purchasing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/orders/${order.id}`}
                          className="hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {order.customer ? (
                          <span className="font-medium">
                            {order.customer.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Guest User
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription className="mt-1">
                Best performers by units sold
              </CardDescription>
            </div>
            <Link
              href="/analytics/best-sellers"
              className="text-sm font-medium text-primary hover:underline"
            >
              View full report
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No sales data yet. Top products will appear once orders are completed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 py-2 border-b last:border-0"
                >
                  <span className="text-lg font-bold text-muted-foreground w-6 shrink-0 text-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.category_name ?? 'Uncategorized'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{product.total_units} units</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
