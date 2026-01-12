import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  CreditCard,
  Truck,
  ArrowUpRight,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  getSalesStats,
  getDailySales,
  getTopProducts,
  getSalesByCategory,
  getRecentOrders,
  getSalesByPaymentMethod,
} from "@/lib/queries/analytics"
import { SalesChart } from "./sales-chart"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString))
}

function getStatusColor(status: string): string {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800"
    case "shipped":
      return "bg-blue-100 text-blue-800"
    case "processing":
      return "bg-purple-100 text-purple-800"
    case "pending":
    case "confirmed":
      return "bg-yellow-100 text-yellow-800"
    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default async function SalesReportsPage() {
  const [stats, dailySales, topProducts, categoryData, recentOrders, paymentData] = await Promise.all([
    getSalesStats(),
    getDailySales(30),
    getTopProducts(5),
    getSalesByCategory(),
    getRecentOrders(10),
    getSalesByPaymentMethod(),
  ])

  const hasData = stats.totalOrders > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-muted-foreground">
            Analyze your sales performance and trends
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Revenue</span>
            </div>
            {stats.revenueGrowth !== 0 && (
              <Badge
                variant="outline"
                className={stats.revenueGrowth > 0 ? "text-green-600" : "text-red-600"}
              >
                {stats.revenueGrowth > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(stats.revenueGrowth).toFixed(1)}%
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">All time sales</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm">Total Orders</span>
            </div>
            {stats.ordersGrowth !== 0 && (
              <Badge
                variant="outline"
                className={stats.ordersGrowth > 0 ? "text-green-600" : "text-red-600"}
              >
                {stats.ordersGrowth > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(stats.ordersGrowth).toFixed(1)}%
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
          <p className="text-xs text-muted-foreground">Completed orders</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Avg. Order Value</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
          <p className="text-xs text-muted-foreground">Per order</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Package className="h-4 w-4" />
            <span className="text-sm">Units Sold</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalUnitsSold}</p>
          <p className="text-xs text-muted-foreground">Total items</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Last 30 days performance</CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <SalesChart data={dailySales} />
            ) : (
              <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data available yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performers by units sold</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.unitsSold} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No product sales data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                {categoryData.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(category.revenue)} ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No category data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Order breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentData.map((payment) => (
                <div key={payment.method} className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    {payment.method === "Online Payment" ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <Truck className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{payment.method}</p>
                    <p className="text-sm text-muted-foreground">{payment.count} orders</p>
                  </div>
                  <div className="text-right font-semibold">
                    {formatCurrency(payment.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Conversion Rate</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Return Rate</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Repeat Customers</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Avg. Cart Size</span>
              <span className="font-semibold">
                {stats.totalOrders > 0
                  ? (stats.totalUnitsSold / stats.totalOrders).toFixed(1)
                  : "-"} items
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/orders">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{order.orderNumber}</p>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sales will appear here once orders are placed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
