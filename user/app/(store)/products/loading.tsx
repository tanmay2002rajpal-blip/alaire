/**
 * @fileoverview Loading state for products listing page.
 * Shows skeleton grid while products are being fetched.
 *
 * @module app/(store)/products/loading
 */

import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeletons"

export default function ProductsLoading() {
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Filters bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Product grid */}
      <ProductGridSkeleton count={12} />
    </div>
  )
}
