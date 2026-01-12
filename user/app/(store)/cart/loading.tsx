/**
 * @fileoverview Loading state for cart page.
 * Shows skeleton while cart items are being loaded.
 *
 * @module app/(store)/cart/loading
 */

import { CartItemSkeleton, Skeleton } from "@/components/ui/skeletons"

export default function CartLoading() {
  return (
    <div className="container py-8">
      {/* Header */}
      <Skeleton className="h-10 w-48 mb-8" />

      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Cart items */}
        <div className="lg:col-span-7 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pb-6 border-b">
              <CartItemSkeleton />
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-5 mt-8 lg:mt-0">
          <div className="rounded-lg border p-6 space-y-4 animate-pulse">
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

            <Skeleton className="h-12 w-full mt-6" />
          </div>
        </div>
      </div>
    </div>
  )
}
