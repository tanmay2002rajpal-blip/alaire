import {
  Skeleton,
  SkeletonStatsCard,
  SkeletonTable,
} from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function NewsletterLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Subscribers Table */}
      <Card>
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-28" />
        </div>
        <SkeletonTable columns={4} rows={10} />
      </Card>
    </div>
  )
}
