import { Suspense } from 'react'
import { getCoupons, getCouponStats } from '@/lib/queries/coupons'
import { CouponsClient } from './coupons-client'
import { Skeleton } from '@/components/ui/skeleton'

interface CouponsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    type?: string
    page?: string
  }>
}

function CouponsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}

export default async function CouponsPage({ searchParams }: CouponsPageProps) {
  const awaitedSearchParams = await searchParams

  const filters = {
    search: awaitedSearchParams.search,
    status: awaitedSearchParams.status as 'all' | 'active' | 'inactive' | 'expired' | undefined,
    type: awaitedSearchParams.type as 'all' | 'percentage' | 'fixed' | undefined,
    page: parseInt(awaitedSearchParams.page || '1', 10),
  }

  const [couponsData, stats] = await Promise.all([
    getCoupons(filters),
    getCouponStats(),
  ])

  return (
    <Suspense fallback={<CouponsLoadingSkeleton />}>
      <CouponsClient
        coupons={couponsData}
        stats={stats}
        currentFilters={filters}
      />
    </Suspense>
  )
}
