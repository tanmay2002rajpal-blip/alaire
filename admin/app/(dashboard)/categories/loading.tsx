import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

function SkeletonCategoryRow({ level = 0 }: { level?: number }) {
  return (
    <Card className="mb-2">
      <div className="p-4 flex items-center gap-3">
        {/* Expand Button */}
        <div style={{ marginLeft: `${level * 24}px` }}>
          <Skeleton className="h-6 w-6" />
        </div>

        {/* Folder Icon */}
        <Skeleton className="h-5 w-5" />

        {/* Image */}
        <Skeleton className="h-12 w-12 rounded" />

        {/* Category Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>

        {/* Product Count */}
        <Skeleton className="h-4 w-20" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </Card>
  )
}

export default function CategoriesLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Category Tree */}
      <div className="space-y-0">
        {/* Root categories */}
        <SkeletonCategoryRow />
        <SkeletonCategoryRow />
        {/* Nested subcategories */}
        <SkeletonCategoryRow level={1} />
        <SkeletonCategoryRow level={1} />
        <SkeletonCategoryRow level={2} />
        <SkeletonCategoryRow />
        <SkeletonCategoryRow level={1} />
        <SkeletonCategoryRow />
      </div>
    </div>
  )
}
