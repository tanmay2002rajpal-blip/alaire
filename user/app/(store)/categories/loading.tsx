/**
 * @fileoverview Loading state for categories listing page.
 * Shows skeleton grid while categories are being fetched.
 *
 * @module app/(store)/categories/loading
 */

import { Skeleton } from "@/components/ui/skeletons"

export default function CategoriesLoading() {
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <Skeleton className="h-10 w-48 mx-auto mb-2" />
        <Skeleton className="h-5 w-72 mx-auto" />
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] rounded-lg bg-muted" />
            <div className="mt-4 text-center">
              <Skeleton className="h-5 w-24 mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
