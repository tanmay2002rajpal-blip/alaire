/**
 * @fileoverview Loading state for checkout page.
 * Shows skeleton while checkout form is being prepared.
 *
 * @module app/(store)/checkout/loading
 */

import { Skeleton } from "@/components/ui/skeletons"

export default function CheckoutLoading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-10 w-48 mb-8" />

      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Checkout form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Contact info card */}
          <div className="rounded-lg border p-6 space-y-4 animate-pulse">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Shipping address card */}
          <div className="rounded-lg border p-6 space-y-4 animate-pulse">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Payment method card */}
          <div className="rounded-lg border p-6 space-y-4 animate-pulse">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-5 mt-8 lg:mt-0">
          <div className="rounded-lg border p-6 space-y-4 animate-pulse sticky top-24">
            <Skeleton className="h-6 w-32 mb-4" />

            {/* Items */}
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
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

            <Skeleton className="h-12 w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
