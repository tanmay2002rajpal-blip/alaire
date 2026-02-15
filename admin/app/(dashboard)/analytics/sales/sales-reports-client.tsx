"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  CalendarDays,
  BarChart3,
  PieChart,
} from "lucide-react"
import { SalesChart } from "./sales-chart"

interface SalesReportsClientProps {
  stats: {
    totalRevenue: number
    totalOrders: number
    avgOrderValue: number
    totalUnitsSold: number
    revenueGrowth: number
    ordersGrowth: number
  }
  dailySales: Array<{
    date: string
    revenue: number
    orders: number
  }>
  topProducts: Array<{
    id: string
    name: string
    imageUrl: string | null
    unitsSold: number
    revenue: number
  }>
  categoryData: Array<{
    id: string
    name: string
    revenue: number
    percentage: number
  }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    customerName: string
    total: number
    status: string
    createdAt: string
  }>
  paymentData: Array<{
    method: string
    count: number
    revenue: number
  }>
}

type DateRange = "7d" | "30d" | "90d" | "1y"

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

export function SalesReportsClient({
  stats,
  dailySales,
  topProducts,
  categoryData,
  recentOrders,
  paymentData,
}: SalesReportsClientProps) {
  const [dateRange, setDateRange] = React.useState<DateRange>("30d")

  const hasData = stats.totalOrders > 0

  // Filter daily sales based on date range
  const filteredDailySales = React.useMemo(() => {
    const days = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    }[dateRange]
    return dailySales.slice(-days)
  }, [dailySales, dateRange])

  const handleExport = () => {
    // Create CSV content
    const headers = ["Date", "Revenue", "Orders"]
    const rows = filteredDailySales.map((d) => [d.date, d.revenue, d.orders])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")

    // Download
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-report-${dateRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-muted-foreground">
            Analyze your sales performance and trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40">
              <CalendarDays className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            {stats.revenueGrowth !== 0 && (
              <Badge
                variant="outline"
                className={stats.revenueGrowth > 0 ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"}
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
          <p className="text-3xl font-bold mt-3">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">All time sales</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Total Orders</span>
            </div>
            {stats.ordersGrowth !== 0 && (
              <Badge
                variant="outline"
                className={stats.ordersGrowth > 0 ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"}
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
          <p className="text-3xl font-bold mt-3">{stats.totalOrders}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed orders</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium">Avg. Order Value</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Per order</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-sm font-medium">Units Sold</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalUnitsSold}</p>
          <p className="text-xs text-muted-foreground mt-1">Total items</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Over Time
            </CardTitle>
            <CardDescription>
              {dateRange === "7d" && "Last 7 days performance"}
              {dateRange === "30d" && "Last 30 days performance"}
              {dateRange === "90d" && "Last 90 days performance"}
              {dateRange === "1y" && "Last year performance"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <SalesChart data={filteredDailySales} />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gradient-to-b from-muted/50 to-transparent rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium">No sales data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Revenue will appear here once orders are placed
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
            <CardDescription>Best performers by units sold</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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
                        {product.unitsSold} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gradient-to-b from-muted/50 to-transparent rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium">No product sales yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Top products will appear here
                  </p>
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
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Sales by Category
            </CardTitle>
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
                        {formatCurrency(category.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary rounded-full h-2.5 transition-all"
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {category.percentage.toFixed(1)}% of total
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <PieChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No category data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Order breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentData.map((payment) => (
                <div key={payment.method} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="p-2.5 rounded-lg bg-background">
                    {payment.method === "Online Payment" ? (
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Truck className="h-5 w-5 text-orange-600" />
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
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">Conversion Rate</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">Return Rate</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">Repeat Customers</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-muted-foreground">Avg. Cart Size</span>
              <span className="font-semibold">
                {stats.totalOrders > 0
                  ? (stats.totalUnitsSold / stats.totalOrders).toFixed(1)
                  : "-"}{" "}
                items
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
            <div className="space-y-2">
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
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Orders will appear here once customers start purchasing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
