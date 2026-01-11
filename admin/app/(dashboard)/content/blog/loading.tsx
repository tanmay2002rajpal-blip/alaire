import { Skeleton, SkeletonStatsCard } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

function SkeletonBlogPostRow() {
  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {/* Image Preview */}
        <Skeleton className="w-48 h-32 flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-lg" />
              <Skeleton className="h-4 w-3/4 max-w-md" />
              <Skeleton className="h-3 w-56" />
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

export default function BlogPostsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        <SkeletonBlogPostRow />
        <SkeletonBlogPostRow />
        <SkeletonBlogPostRow />
        <SkeletonBlogPostRow />
        <SkeletonBlogPostRow />
      </div>
    </div>
  )
}
