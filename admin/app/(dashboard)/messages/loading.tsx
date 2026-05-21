import {
  Skeleton,
  SkeletonStatsCard,
  SkeletonTable,
  SkeletonTabs,
} from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex gap-2 flex-1">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>

        {/* Status Filter Tabs */}
        <SkeletonTabs count={4} />
      </div>

      {/* Messages Table */}
      <SkeletonTable columns={5} rows={10} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-8" />
            ))}
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  )
}
