import {
  Skeleton,
  SkeletonStatsCard,
  SkeletonTable,
  SkeletonTabs,
} from "@/components/ui/skeleton"

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SkeletonTabs count={3} />
        <SkeletonTabs count={3} />
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Products Table */}
      <SkeletonTable columns={8} rows={10} />

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
