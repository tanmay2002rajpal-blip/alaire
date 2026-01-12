/**
 * @fileoverview Loading state for order detail page.
 * Shows skeleton while order details are being fetched.
 *
 * @module app/(store)/account/orders/[id]/loading
 */

import { Skeleton } from "@/components/ui/skeletons"

export default function OrderDetailLoading() {
  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-8">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Order header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Order items */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-lg border p-6 animate-pulse">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b last:border-0">
                  <Skeleton className="h-20 w-20 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Order tracking */}
          <div className="rounded-lg border p-6 animate-pulse">
            <Skeleton className="h-6 w-40 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-4 mt-8 lg:mt-0 space-y-6">
          {/* Summary card */}
          <div className="rounded-lg border p-6 animate-pulse">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex justify-between pt-4 border-t">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="rounded-lg border p-6 animate-pulse">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
