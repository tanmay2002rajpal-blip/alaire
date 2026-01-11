import { Skeleton, SkeletonStatsCard } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

function SkeletonSlideRow() {
  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {/* Drag Handle & Position */}
        <div className="flex items-center px-4 bg-muted/50 border-r">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-3 w-4" />
          </div>
        </div>

        {/* Image Preview */}
        <Skeleton className="w-48 h-28 flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <Skeleton className="h-3 w-48 mt-2" />
        </div>
      </div>
    </Card>
  )
}

export default function HeroSlidesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Slides List */}
      <div className="space-y-4">
        <SkeletonSlideRow />
        <SkeletonSlideRow />
        <SkeletonSlideRow />
        <SkeletonSlideRow />
      </div>
    </div>
  )
}
