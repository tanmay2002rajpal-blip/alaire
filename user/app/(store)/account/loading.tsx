/**
 * @fileoverview Loading state for account dashboard.
 * Shows skeleton while account data is being fetched.
 *
 * @module app/(store)/account/loading
 */

import { Skeleton } from "@/components/ui/skeletons"

export default function AccountLoading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-10 w-48 mb-8" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile card */}
        <div className="rounded-lg border p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Quick stats */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 animate-pulse">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <Skeleton className="h-7 w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Skeleton className="h-5 w-28 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
