import { Suspense } from 'react';
import Link from 'next/link';
import { Package, Clock, TrendingUp, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOrders, getOrderStats } from '@/lib/queries/orders';
import { OrderFilters } from '@/components/orders/order-filters';
import { OrdersTable } from '@/components/orders/orders-table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface OrdersPageProps {
  searchParams: {
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  };
}

// Pagination Component
function ClientPagination({ currentPage, totalPages, searchParams }: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string>;
}) {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '/orders';
  };

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevious}
          asChild={hasPrevious}
        >
          {hasPrevious ? (
            <Link href={createPageUrl(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Link>
          ) : (
            <span className="flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          asChild={hasNext}
        >
          {hasNext ? (
            <Link href={createPageUrl(currentPage + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          ) : (
            <span className="flex items-center">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Loading States
function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableLoading() {
  return (
    <div className="rounded-md border">
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

// Status Filter Tabs Component
function StatusTabs({ currentStatus, searchParams }: {
  currentStatus?: string;
  searchParams: Record<string, string>;
}) {
  const statuses = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
  ];

  const createStatusUrl = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page'); // Reset to page 1 when changing status
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '/orders';
  };

  return (
    <Tabs defaultValue={currentStatus || ''} className="w-full">
      <TabsList>
        {statuses.map((status) => (
          <TabsTrigger key={status.value} value={status.value} asChild>
            <Link href={createStatusUrl(status.value)}>
              {status.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const awaitedSearchParams = await searchParams;

  // Parse search params
  const filters = {
    status: awaitedSearchParams.status,
    search: awaitedSearchParams.search,
    dateFrom: awaitedSearchParams.dateFrom,
    dateTo: awaitedSearchParams.dateTo,
    page: parseInt(awaitedSearchParams.page || '1', 10),
  };

  // Fetch orders and stats
  const [ordersData, stats] = await Promise.all([
    getOrders(filters),
    getOrderStats(),
  ]);

  // Transform orders for the table component
  const transformedOrders = ordersData.orders.map(order => ({
    id: order.id,
    order_number: order.order_number,
    total: order.total,
    status: order.status,
    created_at: order.created_at,
    user: {
      name: order.customer_name,
      email: order.customer_email,
    },
    items_count: order.items_count,
  }));

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Build search params object for pagination
  const searchParamsObj: Record<string, string> = {};
  if (awaitedSearchParams.status) searchParamsObj.status = awaitedSearchParams.status;
  if (awaitedSearchParams.search) searchParamsObj.search = awaitedSearchParams.search;
  if (awaitedSearchParams.dateFrom) searchParamsObj.dateFrom = awaitedSearchParams.dateFrom;
  if (awaitedSearchParams.dateTo) searchParamsObj.dateTo = awaitedSearchParams.dateTo;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all customer orders
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsLoading />}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Orders"
            value={stats.total_orders.toLocaleString()}
            description="All time orders"
            icon={ShoppingCart}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Pending Orders"
            value={stats.pending.toLocaleString()}
            description="Awaiting processing"
            icon={Clock}
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Processing"
            value={stats.processing.toLocaleString()}
            description="Currently being processed"
            icon={Package}
            iconColor="text-purple-600"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.total_revenue)}
            description="From completed orders"
            icon={TrendingUp}
            iconColor="text-green-600"
          />
        </div>
      </Suspense>

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-4">
        <StatusTabs currentStatus={awaitedSearchParams.status} searchParams={searchParamsObj} />
      </div>

      {/* Advanced Filters */}
      <OrderFilters filters={filters} />

      {/* Bulk Actions Placeholder - shown when orders are selected */}
      {/* This would be managed by client-side state in OrdersTable */}

      {/* Orders Table */}
      <Suspense fallback={<TableLoading />}>
        {transformedOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {filters.status || filters.search || filters.dateFrom || filters.dateTo
                  ? 'Try adjusting your filters to see more results.'
                  : 'Orders will appear here once customers start placing them.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <OrdersTable orders={transformedOrders} />

            {/* Pagination */}
            {ordersData.totalPages > 1 && (
              <ClientPagination
                currentPage={ordersData.page}
                totalPages={ordersData.totalPages}
                searchParams={searchParamsObj}
              />
            )}
          </div>
        )}
      </Suspense>

      {/* Additional Info */}
      <div className="text-sm text-muted-foreground">
        Showing {transformedOrders.length} of {ordersData.total.toLocaleString()} total orders
      </div>
    </div>
  );
}
