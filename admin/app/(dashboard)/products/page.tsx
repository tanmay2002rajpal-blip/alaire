import { Suspense } from 'react';
import Link from 'next/link';
import {
  Package,
  PackageCheck,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import { getProducts, getProductStats, getCategories } from '@/lib/queries/products';
import { ProductsClientWrapper } from '@/components/products/products-client-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryFilter } from '@/components/products/category-filter';

interface ProductsPageProps {
  searchParams: {
    category_id?: string;
    search?: string;
    status?: string;
    stock_level?: string;
    page?: string;
  };
}

// Stats Card Component
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
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

// Pagination Component
function ClientPagination({
  currentPage,
  totalPages,
  searchParams,
}: {
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
    return queryString ? `?${queryString}` : '/products';
  };

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrevious} asChild={hasPrevious}>
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
        <Button variant="outline" size="sm" disabled={!hasNext} asChild={hasNext}>
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

// Status Filter Tabs Component
function StatusTabs({
  currentStatus,
  searchParams,
}: {
  currentStatus?: string;
  searchParams: Record<string, string>;
}) {
  const statuses = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
  ];

  const createStatusUrl = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page');
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '/products';
  };

  return (
    <Tabs defaultValue={currentStatus || ''} className="w-full">
      <TabsList>
        {statuses.map((status) => (
          <TabsTrigger key={status.value} value={status.value} asChild>
            <Link href={createStatusUrl(status.value)}>{status.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

// Stock Level Filter Tabs
function StockLevelTabs({
  currentLevel,
  searchParams,
}: {
  currentLevel?: string;
  searchParams: Record<string, string>;
}) {
  const levels = [
    { value: '', label: 'All Stock' },
    { value: 'low', label: 'Low Stock' },
    { value: 'out', label: 'Out of Stock' },
  ];

  const createLevelUrl = (level: string) => {
    const params = new URLSearchParams(searchParams);
    if (level) {
      params.set('stock_level', level);
    } else {
      params.delete('stock_level');
    }
    params.delete('page');
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '/products';
  };

  return (
    <Tabs defaultValue={currentLevel || ''} className="w-full">
      <TabsList>
        {levels.map((level) => (
          <TabsTrigger key={level.value} value={level.value} asChild>
            <Link href={createLevelUrl(level.value)}>{level.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

// Filters Component
async function ProductFilters({
  currentSearch,
  currentCategory,
  searchParams,
}: {
  currentSearch?: string;
  currentCategory?: string;
  searchParams: Record<string, string>;
}) {
  const categories = await getCategories();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <form className="flex-1" action="/products" method="get">
        {Object.entries(searchParams).map(([key, value]) => {
          if (key !== 'search') {
            return <input key={key} type="hidden" name={key} value={value} />;
          }
          return null;
        })}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search products..."
            defaultValue={currentSearch}
            className="pl-9"
          />
        </div>
      </form>
      <CategoryFilter
        categories={categories}
        currentCategory={currentCategory}
      />
    </div>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const awaitedSearchParams = await searchParams;

  // Parse search params
  const filters = {
    category_id: awaitedSearchParams.category_id,
    search: awaitedSearchParams.search,
    status: awaitedSearchParams.status as 'active' | 'inactive' | 'all' | undefined,
    stock_level: awaitedSearchParams.stock_level as 'low' | 'out' | 'all' | undefined,
    page: parseInt(awaitedSearchParams.page || '1', 10),
  };

  // Fetch products and stats
  const [productsData, stats] = await Promise.all([
    getProducts(filters),
    getProductStats(),
  ]);

  // Transform products for the table component
  const transformedProducts = productsData.products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    images: product.images,
    category_name: product.category_name || 'Uncategorized',
    price: product.min_price || product.base_price || 0,
    stock: product.total_stock || 0,
    is_active: product.is_active,
    created_at: product.created_at,
  }));

  // Build search params object for pagination
  const searchParamsObj: Record<string, string> = {};
  if (awaitedSearchParams.category_id)
    searchParamsObj.category_id = awaitedSearchParams.category_id;
  if (awaitedSearchParams.search) searchParamsObj.search = awaitedSearchParams.search;
  if (awaitedSearchParams.status) searchParamsObj.status = awaitedSearchParams.status;
  if (awaitedSearchParams.stock_level)
    searchParamsObj.stock_level = awaitedSearchParams.stock_level;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product inventory and catalog
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsLoading />}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Products"
            value={stats.total_products.toLocaleString()}
            description="All products in catalog"
            icon={Package}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Active Products"
            value={stats.active_products.toLocaleString()}
            description="Currently available"
            icon={PackageCheck}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Low Stock"
            value={stats.low_stock_count.toLocaleString()}
            description="10 units or less"
            icon={AlertTriangle}
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Out of Stock"
            value={stats.out_of_stock_count.toLocaleString()}
            description="Need restock"
            icon={XCircle}
            iconColor="text-red-600"
          />
        </div>
      </Suspense>

      {/* Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <StatusTabs currentStatus={awaitedSearchParams.status} searchParams={searchParamsObj} />
        <StockLevelTabs
          currentLevel={awaitedSearchParams.stock_level}
          searchParams={searchParamsObj}
        />
      </div>

      {/* Search and Category Filters */}
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <ProductFilters
          currentSearch={awaitedSearchParams.search}
          currentCategory={awaitedSearchParams.category_id}
          searchParams={searchParamsObj}
        />
      </Suspense>

      {/* Products Table */}
      <Suspense fallback={<TableLoading />}>
        {transformedProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                {filters.status || filters.search || filters.category_id || filters.stock_level
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by adding your first product.'}
              </p>
              {!filters.status && !filters.search && !filters.category_id && !filters.stock_level && (
                <Button asChild>
                  <Link href="/products/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <ProductsClientWrapper products={transformedProducts} />

            {/* Pagination */}
            {productsData.totalPages > 1 && (
              <ClientPagination
                currentPage={productsData.page}
                totalPages={productsData.totalPages}
                searchParams={searchParamsObj}
              />
            )}
          </div>
        )}
      </Suspense>

      {/* Additional Info */}
      <div className="text-sm text-muted-foreground">
        Showing {transformedProducts.length} of {productsData.total.toLocaleString()} total products
      </div>
    </div>
  );
}
