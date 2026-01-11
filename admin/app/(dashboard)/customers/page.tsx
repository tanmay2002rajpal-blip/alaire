import { Suspense } from 'react'
import { getCustomers, getCustomerStats } from '@/lib/queries/customers'
import { CustomersClient } from './customers-client'
import { Skeleton } from '@/components/ui/skeleton'

interface CustomersPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    sort_by?: string
    sort_order?: string
    page?: string
  }>
}

function CustomersLoadingSkeleton() {
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

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const awaitedSearchParams = await searchParams

  const filters = {
    search: awaitedSearchParams.search,
    status: awaitedSearchParams.status as 'all' | 'active' | 'inactive' | undefined,
    sort_by: awaitedSearchParams.sort_by as 'created_at' | 'total_spent' | 'total_orders' | 'last_order' | undefined,
    sort_order: awaitedSearchParams.sort_order as 'asc' | 'desc' | undefined,
    page: parseInt(awaitedSearchParams.page || '1', 10),
  }

  const [customersData, stats] = await Promise.all([
    getCustomers(filters),
    getCustomerStats(),
  ])

  return (
    <Suspense fallback={<CustomersLoadingSkeleton />}>
      <CustomersClient
        customers={customersData}
        stats={stats}
        currentFilters={filters}
      />
    </Suspense>
  )
}
