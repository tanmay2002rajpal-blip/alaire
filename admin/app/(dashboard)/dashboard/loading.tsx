import {
  Skeleton,
  SkeletonStatsCard,
  SkeletonChart,
  SkeletonTable,
} from "@/components/ui/skeleton"

function SkeletonActivityFeed() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <Skeleton className="h-5 w-32 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonRecentOrders() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
      <SkeletonTable columns={5} rows={5} />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonChart className="lg:col-span-2" />
        <SkeletonActivityFeed />
      </div>

      {/* Recent Orders */}
      <SkeletonRecentOrders />
    </div>
  )
}
