/**
 * @fileoverview Loading state for category detail page.
 * Shows skeleton while category products are being fetched.
 *
 * @module app/(store)/categories/[slug]/loading
 */

import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeletons"

export default function CategoryDetailLoading() {
  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-8">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Category header */}
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Products grid */}
      <ProductGridSkeleton count={12} />
    </div>
  )
}
