'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Search,
  RefreshCw,
  Edit2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatPrice } from '@/lib/utils'
import { updateStockAction } from '@/lib/actions/inventory'
import type { InventoryItem, InventoryStats, PaginatedInventory } from '@/lib/queries/inventory'
import type { Category } from '@/lib/queries/products'

interface InventoryClientProps {
  inventory: PaginatedInventory
  stats: InventoryStats
  categories: Category[]
  currentFilters: {
    search?: string
    stock_status?: string
    category_id?: string
    page: number
  }
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
}: {
  title: string
  value: string
  description?: string
  icon: React.ElementType
  iconColor: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function StockStatusBadge({ stock, threshold }: { stock: number; threshold: number | null }) {
  const effectiveThreshold = threshold || 10

  if (stock === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Out of Stock
      </Badge>
    )
  }

  if (stock < effectiveThreshold) {
    return (
      <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <AlertTriangle className="h-3 w-3" />
        Low Stock
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      <CheckCircle className="h-3 w-3" />
      In Stock
    </Badge>
  )
}

export function InventoryClient({
  inventory,
  stats,
  categories,
  currentFilters,
}: InventoryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)

  // Update URL with new filters
  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset page when filters change
    if (!updates.page) {
      params.delete('page')
    }

    startTransition(() => {
      router.push(`/inventory?${params.toString()}`)
    })
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchValue || undefined })
  }

  // Handle stock status filter
  const handleStockStatusChange = (value: string) => {
    updateFilters({ stock_status: value === 'all' ? undefined : value })
  }

  // Handle category filter
  const handleCategoryChange = (value: string) => {
    updateFilters({ category_id: value === 'all' ? undefined : value })
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() })
  }

  // Start editing stock
  const startEditing = (item: InventoryItem) => {
    setEditingId(item.id)
    setEditValue(item.current_stock)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null)
    setEditValue(0)
  }

  // Save stock update
  const saveStock = async (variantId: string) => {
    const result = await updateStockAction(variantId, editValue, 'set')

    if (result.success) {
      toast.success('Stock updated successfully')
      setEditingId(null)
      router.refresh()
    } else {
      toast.error('Failed to update stock', {
        description: result.error,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage stock levels across all products
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.refresh()}
          disabled={isPending}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isPending && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Items"
          value={stats.total_items.toLocaleString()}
          description="Active products"
          icon={Package}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="In Stock"
          value={stats.in_stock_items.toLocaleString()}
          description="Healthy stock levels"
          icon={CheckCircle}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Low Stock"
          value={stats.low_stock_items.toLocaleString()}
          description="Need attention"
          icon={AlertTriangle}
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Stock Value"
          value={formatPrice(stats.total_stock_value)}
          description="Total inventory value"
          icon={DollarSign}
          iconColor="text-purple-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {/* Stock Status Filter */}
        <Tabs
          value={currentFilters.stock_status || 'all'}
          onValueChange={handleStockStatusChange}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="in_stock">In Stock</TabsTrigger>
            <TabsTrigger value="low_stock">Low Stock</TabsTrigger>
            <TabsTrigger value="out_of_stock">Out of Stock</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category Filter */}
        <Select
          value={currentFilters.category_id || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8 mb-2" />
                    <p>No inventory items found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              inventory.items.map((item) => (
                <TableRow key={item.id}>
                  {/* Image */}
                  <TableCell>
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
                      {item.product_image ? (
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Product Name */}
                  <TableCell>
                    <div>
                      <Link
                        href={`/products/${item.product_id}`}
                        className="font-medium hover:underline"
                      >
                        {item.product_name}
                      </Link>
                      {item.variant_name && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant_name}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <span className="text-muted-foreground">
                      {item.category_name || 'Uncategorized'}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StockStatusBadge
                      stock={item.current_stock}
                      threshold={item.low_stock_threshold}
                    />
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-right font-medium">
                    {formatPrice(item.price)}
                  </TableCell>

                  {/* Stock */}
                  <TableCell className="text-right">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        className="w-20 text-right ml-auto"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={cn(
                          'font-medium',
                          item.current_stock === 0 && 'text-red-600',
                          item.current_stock > 0 &&
                            item.current_stock < (item.low_stock_threshold || 10) &&
                            'text-yellow-600'
                        )}
                      >
                        {item.current_stock}
                      </span>
                    )}
                  </TableCell>

                  {/* Value */}
                  <TableCell className="text-right text-muted-foreground">
                    {formatPrice(item.price * item.current_stock)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {editingId === item.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveStock(item.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {inventory.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((inventory.page - 1) * 25) + 1} to{' '}
            {Math.min(inventory.page * 25, inventory.total)} of {inventory.total} items
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={inventory.page === 1 || isPending}
              onClick={() => handlePageChange(inventory.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, inventory.totalPages) }, (_, i) => {
                let pageNum: number
                if (inventory.totalPages <= 5) {
                  pageNum = i + 1
                } else if (inventory.page <= 3) {
                  pageNum = i + 1
                } else if (inventory.page >= inventory.totalPages - 2) {
                  pageNum = inventory.totalPages - 4 + i
                } else {
                  pageNum = inventory.page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === inventory.page ? 'default' : 'outline'}
                    size="sm"
                    className="w-8"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isPending}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={inventory.page === inventory.totalPages || isPending}
              onClick={() => handlePageChange(inventory.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
