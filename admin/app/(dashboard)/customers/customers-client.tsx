'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  UserCheck,
  DollarSign,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  Mail,
  Phone,
  ShoppingBag,
  Calendar,
  Eye,
  UserX,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatPrice } from '@/lib/utils'
import { toggleCustomerStatusAction, exportCustomersAction } from '@/lib/actions/customers'
import type { Customer, CustomerStats, PaginatedCustomers } from '@/lib/queries/customers'

interface CustomersClientProps {
  customers: PaginatedCustomers
  stats: CustomerStats
  currentFilters: {
    search?: string
    status?: string
    sort_by?: string
    sort_order?: string
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatRelativeTime(dateString: string | null) {
  if (!dateString) return 'Never'

  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function CustomersClient({
  customers,
  stats,
  currentFilters,
}: CustomersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')
  const [isExporting, setIsExporting] = useState(false)

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
      router.push(`/customers?${params.toString()}`)
    })
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchValue || undefined })
  }

  // Handle status filter
  const handleStatusChange = (value: string) => {
    updateFilters({ status: value === 'all' ? undefined : value })
  }

  // Handle sort
  const handleSort = (column: string) => {
    const newOrder =
      currentFilters.sort_by === column && currentFilters.sort_order === 'desc'
        ? 'asc'
        : 'desc'
    updateFilters({ sort_by: column, sort_order: newOrder })
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() })
  }

  // Handle toggle status
  const handleToggleStatus = async (customer: Customer) => {
    const result = await toggleCustomerStatusAction(customer.id)

    if (result.success) {
      toast.success(
        customer.is_active ? 'Customer deactivated' : 'Customer activated'
      )
      router.refresh()
    } else {
      toast.error('Failed to update customer', {
        description: result.error,
      })
    }
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportCustomersAction()

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Customers exported successfully')
      } else {
        toast.error('Failed to export customers', {
          description: result.error,
        })
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer base and view their activity
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className={cn('h-4 w-4 mr-2', isExporting && 'animate-spin')} />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Customers"
          value={stats.total_customers.toLocaleString()}
          description="All registered users"
          icon={Users}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="New This Month"
          value={stats.new_this_month.toLocaleString()}
          description="Joined recently"
          icon={UserPlus}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Active Customers"
          value={stats.active_customers.toLocaleString()}
          description="Ordered in last 30 days"
          icon={UserCheck}
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Total Revenue"
          value={formatPrice(stats.total_revenue)}
          description="From all orders"
          icon={DollarSign}
          iconColor="text-yellow-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {/* Status Filter */}
        <Tabs
          value={currentFilters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort */}
        <Select
          value={`${currentFilters.sort_by || 'created_at'}-${currentFilters.sort_order || 'desc'}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-')
            updateFilters({ sort_by: sortBy, sort_order: sortOrder })
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
            <SelectItem value="created_at-asc">Oldest First</SelectItem>
            <SelectItem value="total_spent-desc">Highest Spent</SelectItem>
            <SelectItem value="total_orders-desc">Most Orders</SelectItem>
            <SelectItem value="last_order-desc">Recent Order</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-8 w-8 mb-2" />
                    <p>No customers found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.customers.map((customer) => (
                <TableRow key={customer.id}>
                  {/* Customer */}
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {customer.full_name || 'Unnamed Customer'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customer.email}
                      </p>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a
                          href={`mailto:${customer.email}`}
                          className="hover:underline"
                        >
                          Email
                        </a>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={`tel:${customer.phone}`}
                            className="hover:underline"
                          >
                            {customer.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Orders */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{customer.total_orders}</span>
                    </div>
                  </TableCell>

                  {/* Total Spent */}
                  <TableCell className="text-right font-medium">
                    {formatPrice(customer.total_spent)}
                  </TableCell>

                  {/* Last Order */}
                  <TableCell>
                    <span className="text-muted-foreground">
                      {formatRelativeTime(customer.last_order_at)}
                    </span>
                  </TableCell>

                  {/* Joined */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(customer.created_at)}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={customer.is_active ? 'default' : 'secondary'}
                      className={
                        customer.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : ''
                      }
                    >
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`mailto:${customer.email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(customer)}
                          className={
                            customer.is_active
                              ? 'text-red-600'
                              : 'text-green-600'
                          }
                        >
                          {customer.is_active ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {customers.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((customers.page - 1) * 25) + 1} to{' '}
            {Math.min(customers.page * 25, customers.total)} of {customers.total} customers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={customers.page === 1 || isPending}
              onClick={() => handlePageChange(customers.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, customers.totalPages) }, (_, i) => {
                let pageNum: number
                if (customers.totalPages <= 5) {
                  pageNum = i + 1
                } else if (customers.page <= 3) {
                  pageNum = i + 1
                } else if (customers.page >= customers.totalPages - 2) {
                  pageNum = customers.totalPages - 4 + i
                } else {
                  pageNum = customers.page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === customers.page ? 'default' : 'outline'}
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
              disabled={customers.page === customers.totalPages || isPending}
              onClick={() => handlePageChange(customers.page + 1)}
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
