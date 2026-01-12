/**
 * @fileoverview Loading state for product detail page.
 * Shows detailed skeleton while product data is being fetched.
 *
 * @module app/(store)/products/[slug]/loading
 */

import { ProductDetailSkeleton, ProductGridSkeleton, Skeleton } from "@/components/ui/skeletons"

export default function ProductDetailLoading() {
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

      {/* Product detail */}
      <ProductDetailSkeleton />

      {/* Related products */}
      <div className="mt-16">
        <Skeleton className="h-8 w-48 mb-6" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  )
}
