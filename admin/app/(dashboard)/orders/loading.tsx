import {
  Skeleton,
  SkeletonStatsCard,
  SkeletonTable,
  SkeletonTabs,
  SkeletonFilterBar,
} from "@/components/ui/skeleton"

function SkeletonOrderFilters() {
  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search Input */}
        <div className="space-y-1.5 sm:col-span-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Status Dropdown */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Date Range */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-4">
        <SkeletonTabs count={5} />
      </div>

      {/* Advanced Filters */}
      <SkeletonOrderFilters />

      {/* Orders Table */}
      <SkeletonTable columns={7} rows={10} />

      {/* Pagination */}
      <div className="flex items-center justify-between border-t pt-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Footer Text */}
      <Skeleton className="h-4 w-48" />
    </div>
  )
}
