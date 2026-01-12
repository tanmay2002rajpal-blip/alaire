/**
 * @fileoverview Loading state for the main store homepage.
 * Shows skeleton while homepage content is being fetched.
 *
 * @module app/(store)/loading
 */

import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeletons"

export default function StoreLoading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="relative h-[80vh] min-h-[600px] w-full animate-pulse bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-12 w-40 mx-auto mt-4" />
          </div>
        </div>
      </div>

      {/* Featured products */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>
        <ProductGridSkeleton count={4} />
      </section>

      {/* Categories preview */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-40 mx-auto mb-4" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
              <Skeleton className="h-5 w-24 mx-auto mt-4" />
            </div>
          ))}
        </div>
      </section>

      {/* Instagram feed placeholder */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-56 mx-auto mb-4" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </section>
    </div>
  )
}
