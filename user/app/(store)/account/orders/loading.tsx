/**
 * @fileoverview Loading state for orders listing page.
 * Shows skeleton while orders are being fetched.
 *
 * @module app/(store)/account/orders/loading
 */

import { OrderCardSkeleton, Skeleton } from "@/components/ui/skeletons"

export default function OrdersLoading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-10 w-48 mb-8" />

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
