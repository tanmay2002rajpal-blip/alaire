/**
 * @fileoverview Loading state for blog article page.
 * Shows skeleton while article content is being fetched.
 *
 * @module app/(store)/blog/[slug]/loading
 */

import { Skeleton } from "@/components/ui/skeletons"

export default function BlogArticleLoading() {
  return (
    <article className="container py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-8">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-pulse">
          <Skeleton className="h-5 w-24 mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-3/4 mb-4" />

          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </header>

        {/* Featured image */}
        <Skeleton className="aspect-[16/9] w-full rounded-lg mb-8" />

        {/* Content */}
        <div className="animate-pulse space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />

          <Skeleton className="h-6 w-48 mt-8 mb-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />

          <Skeleton className="h-6 w-56 mt-8 mb-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </article>
  )
}
