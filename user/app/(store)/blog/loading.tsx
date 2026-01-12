/**
 * @fileoverview Loading state for blog listing page.
 * Shows skeleton while blog posts are being fetched.
 *
 * @module app/(store)/blog/loading
 */

import { Skeleton } from "@/components/ui/skeletons"

export default function BlogLoading() {
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <Skeleton className="h-10 w-32 mx-auto mb-4" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>

      {/* Blog grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <article key={i} className="animate-pulse">
            {/* Featured image */}
            <Skeleton className="aspect-[16/10] w-full rounded-lg mb-4" />

            {/* Category & date */}
            <div className="flex items-center gap-4 mb-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Title */}
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-3/4 mb-3" />

            {/* Excerpt */}
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />

            {/* Read more */}
            <Skeleton className="h-4 w-24 mt-4" />
          </article>
        ))}
      </div>
    </div>
  )
}
