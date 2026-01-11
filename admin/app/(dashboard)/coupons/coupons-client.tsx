'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Ticket,
  Plus,
  Search,
  Percent,
  DollarSign,
  Hash,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Power,
  Loader2,
  Sparkles,
  Calendar,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn, formatPrice } from '@/lib/utils'
import {
  createCouponAction,
  updateCouponAction,
  deleteCouponAction,
  toggleCouponStatusAction,
  generateCouponCodeAction,
} from '@/lib/actions/coupons'
import type { Coupon, CouponStats, PaginatedCoupons, CreateCouponData } from '@/lib/queries/coupons'

interface CouponsClientProps {
  coupons: PaginatedCoupons
  stats: CouponStats
  currentFilters: {
    search?: string
    status?: string
    type?: string
    page: number
  }
}

// Validation schema
const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0.01, 'Discount must be greater than 0'),
  min_order_amount: z.number().min(0).optional().nullable(),
  max_discount: z.number().min(0).optional().nullable(),
  usage_limit: z.number().int().min(1).optional().nullable(),
  valid_from: z.string().min(1, 'Start date is required'),
  valid_until: z.string().optional().nullable(),
  is_active: z.boolean(),
})

type CouponFormData = z.infer<typeof couponSchema>

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

function getCouponStatus(coupon: Coupon): 'active' | 'inactive' | 'expired' | 'scheduled' {
  const now = new Date()
  const validFrom = new Date(coupon.valid_from)
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null

  if (!coupon.is_active) return 'inactive'
  if (validUntil && validUntil < now) return 'expired'
  if (validFrom > now) return 'scheduled'
  return 'active'
}

function CouponStatusBadge({ coupon }: { coupon: Coupon }) {
  const status = getCouponStatus(coupon)

  const variants = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }

  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    expired: 'Expired',
    scheduled: 'Scheduled',
  }

  return (
    <Badge variant="secondary" className={variants[status]}>
      {labels[status]}
    </Badge>
  )
}

export function CouponsClient({
  coupons,
  stats,
  currentFilters,
}: CouponsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: null,
      max_discount: null,
      usage_limit: null,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: null,
      is_active: true,
    },
  })

  const watchDiscountType = watch('discount_type')
  const watchIsActive = watch('is_active')

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

    if (!updates.page) {
      params.delete('page')
    }

    startTransition(() => {
      router.push(`/coupons?${params.toString()}`)
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

  // Handle type filter
  const handleTypeChange = (value: string) => {
    updateFilters({ type: value === 'all' ? undefined : value })
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() })
  }

  // Open add dialog
  const handleAddCoupon = () => {
    setEditingCoupon(null)
    reset({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: null,
      max_discount: null,
      usage_limit: null,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: null,
      is_active: true,
    })
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    reset({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount: coupon.max_discount,
      usage_limit: coupon.usage_limit,
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until?.split('T')[0] || null,
      is_active: coupon.is_active,
    })
    setIsDialogOpen(true)
  }

  // Generate random code
  const handleGenerateCode = async () => {
    setIsGenerating(true)
    try {
      const result = await generateCouponCodeAction()
      if (result.success && result.code) {
        setValue('code', result.code)
        toast.success('Code generated!')
      } else {
        toast.error('Failed to generate code')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  // Submit form
  const onSubmit = async (data: CouponFormData) => {
    setIsSubmitting(true)
    try {
      const couponData: CreateCouponData = {
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_amount: data.min_order_amount || undefined,
        max_discount: data.max_discount || undefined,
        usage_limit: data.usage_limit || undefined,
        valid_from: data.valid_from,
        valid_until: data.valid_until || undefined,
        is_active: data.is_active,
      }

      let result
      if (editingCoupon) {
        result = await updateCouponAction(editingCoupon.id, couponData)
      } else {
        result = await createCouponAction(couponData)
      }

      if (result.success) {
        toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created')
        setIsDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to save coupon')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle status
  const handleToggleStatus = async (coupon: Coupon) => {
    const result = await toggleCouponStatusAction(coupon.id)

    if (result.success) {
      toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to update status')
    }
  }

  // Delete coupon
  const handleDeleteConfirm = async () => {
    if (!deletingCoupon) return

    setIsSubmitting(true)
    try {
      const result = await deleteCouponAction(deletingCoupon.id)

      if (result.success) {
        toast.success('Coupon deleted')
        setIsDeleteDialogOpen(false)
        setDeletingCoupon(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete coupon')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">
            Create and manage discount coupons
          </p>
        </div>
        <Button onClick={handleAddCoupon}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Coupons"
          value={stats.total_coupons.toLocaleString()}
          description="All discount codes"
          icon={Ticket}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Active Coupons"
          value={stats.active_coupons.toLocaleString()}
          description="Currently available"
          icon={Power}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Total Uses"
          value={stats.total_usage.toLocaleString()}
          description="Times redeemed"
          icon={TrendingUp}
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Total Savings"
          value={formatPrice(stats.total_savings)}
          description="Customer savings"
          icon={DollarSign}
          iconColor="text-yellow-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code or description..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <Tabs
          value={currentFilters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={currentFilters.type || 'all'}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coupons Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Ticket className="h-8 w-8 mb-2" />
                    <p>No coupons found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              coupons.coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  {/* Code */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-medium">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(coupon.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Discount */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {coupon.discount_type === 'percentage' ? (
                        <>
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{coupon.discount_value}%</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatPrice(coupon.discount_value)}</span>
                        </>
                      )}
                    </div>
                    {coupon.min_order_amount && (
                      <p className="text-xs text-muted-foreground">
                        Min: {formatPrice(coupon.min_order_amount)}
                      </p>
                    )}
                  </TableCell>

                  {/* Usage */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {coupon.usage_count}
                        {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                      </span>
                    </div>
                  </TableCell>

                  {/* Valid Period */}
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(coupon.valid_from)}
                      </div>
                      {coupon.valid_until && (
                        <div className="text-muted-foreground">
                          to {formatDate(coupon.valid_until)}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <CouponStatusBadge coupon={coupon} />
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
                        <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyCode(coupon.code)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(coupon)}>
                          <Power className="h-4 w-4 mr-2" />
                          {coupon.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeletingCoupon(coupon)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
      {coupons.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((coupons.page - 1) * 25) + 1} to{' '}
            {Math.min(coupons.page * 25, coupons.total)} of {coupons.total} coupons
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={coupons.page === 1 || isPending}
              onClick={() => handlePageChange(coupons.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={coupons.page === coupons.totalPages || isPending}
              onClick={() => handlePageChange(coupons.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon
                ? 'Update the coupon details below.'
                : 'Create a new discount coupon for your customers.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Coupon Code <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  {...register('code')}
                  placeholder="SUMMER2024"
                  className="font-mono uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type</Label>
                <Select
                  value={watchDiscountType}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    setValue('discount_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  Value <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  {...register('discount_value', { valueAsNumber: true })}
                  placeholder={watchDiscountType === 'percentage' ? '10' : '100'}
                />
                {errors.discount_value && (
                  <p className="text-sm text-destructive">{errors.discount_value.message}</p>
                )}
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_amount">Min Order Amount</Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  step="0.01"
                  {...register('min_order_amount', {
                    valueAsNumber: true,
                    setValueAs: (v) => v === '' ? null : parseFloat(v),
                  })}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_discount">Max Discount</Label>
                <Input
                  id="max_discount"
                  type="number"
                  step="0.01"
                  {...register('max_discount', {
                    valueAsNumber: true,
                    setValueAs: (v) => v === '' ? null : parseFloat(v),
                  })}
                  placeholder="1000"
                />
              </div>
            </div>

            {/* Usage Limit */}
            <div className="space-y-2">
              <Label htmlFor="usage_limit">Usage Limit (leave empty for unlimited)</Label>
              <Input
                id="usage_limit"
                type="number"
                {...register('usage_limit', {
                  valueAsNumber: true,
                  setValueAs: (v) => v === '' ? null : parseInt(v),
                })}
                placeholder="100"
              />
            </div>

            {/* Valid Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="valid_from"
                  type="date"
                  {...register('valid_from')}
                />
                {errors.valid_from && (
                  <p className="text-sm text-destructive">{errors.valid_from.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">End Date (optional)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  {...register('valid_until')}
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  {watchIsActive ? 'Coupon is active' : 'Coupon is inactive'}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={watchIsActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCoupon ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the coupon{' '}
              <code className="bg-muted px-1 rounded">{deletingCoupon?.code}</code>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
