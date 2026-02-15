import { Suspense } from "react"
import { SalesReportsClient } from "./sales-reports-client"
import {
  getSalesStats,
  getDailySales,
  getTopProducts,
  getSalesByCategory,
  getRecentOrders,
  getSalesByPaymentMethod,
} from "@/lib/queries/analytics"

export default async function SalesReportsPage() {
  const [stats, dailySales, topProducts, categoryData, recentOrders, paymentData] = await Promise.all([
    getSalesStats(),
    getDailySales(30),
    getTopProducts(5),
    getSalesByCategory(),
    getRecentOrders(10),
    getSalesByPaymentMethod(),
  ])

  return (
    <Suspense fallback={<SalesReportsSkeleton />}>
      <SalesReportsClient
        stats={stats}
        dailySales={dailySales}
        topProducts={topProducts}
        categoryData={categoryData}
        recentOrders={recentOrders}
        paymentData={paymentData}
      />
    </Suspense>
  )
}

function SalesReportsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-40 bg-muted rounded" />
          <div className="h-10 w-32 bg-muted rounded" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-muted rounded-lg" />
        <div className="h-80 bg-muted rounded-lg" />
      </div>
    </div>
  )
}
