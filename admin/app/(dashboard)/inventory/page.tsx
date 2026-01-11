import { Suspense } from 'react'
import { getInventory, getInventoryStats } from '@/lib/queries/inventory'
import { getCategories } from '@/lib/queries/products'
import { InventoryClient } from './inventory-client'
import { Skeleton } from '@/components/ui/skeleton'

interface InventoryPageProps {
  searchParams: Promise<{
    search?: string
    stock_status?: string
    category_id?: string
    page?: string
  }>
}

function InventoryLoadingSkeleton() {
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

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const awaitedSearchParams = await searchParams

  const filters = {
    search: awaitedSearchParams.search,
    stock_status: awaitedSearchParams.stock_status as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | undefined,
    category_id: awaitedSearchParams.category_id,
    page: parseInt(awaitedSearchParams.page || '1', 10),
  }

  const [inventoryData, stats, categories] = await Promise.all([
    getInventory(filters),
    getInventoryStats(),
    getCategories(),
  ])

  return (
    <Suspense fallback={<InventoryLoadingSkeleton />}>
      <InventoryClient
        inventory={inventoryData}
        stats={stats}
        categories={categories}
        currentFilters={filters}
      />
    </Suspense>
  )
}
