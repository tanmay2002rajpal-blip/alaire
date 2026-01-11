import { Skeleton, SkeletonStatsCard } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

function SkeletonPromotionRow() {
  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {/* Image Preview */}
        <Skeleton className="w-48 h-28 flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function PromotionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-72" />
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

      {/* Promotions List */}
      <div className="space-y-4">
        <SkeletonPromotionRow />
        <SkeletonPromotionRow />
        <SkeletonPromotionRow />
      </div>
    </div>
  )
}
