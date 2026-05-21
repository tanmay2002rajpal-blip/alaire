import { Suspense } from 'react'
import { getMessages, getMessageStats } from '@/lib/queries/messages'
import { MessagesClient } from './messages-client'
import { Skeleton } from '@/components/ui/skeleton'

interface MessagesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

function MessagesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
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

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const awaitedSearchParams = await searchParams

  const filters = {
    search: awaitedSearchParams.search,
    status: awaitedSearchParams.status as 'all' | 'unread' | 'read' | 'replied' | undefined,
    page: parseInt(awaitedSearchParams.page || '1', 10),
  }

  const [messagesData, stats] = await Promise.all([
    getMessages(filters),
    getMessageStats(),
  ])

  return (
    <Suspense fallback={<MessagesLoadingSkeleton />}>
      <MessagesClient
        messages={messagesData}
        stats={stats}
        currentFilters={filters}
      />
    </Suspense>
  )
}
