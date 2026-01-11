"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter, X, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface OrderFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

interface OrderFiltersProps {
  filters: OrderFilters
}

const ORDER_STATUSES = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
] as const

export function OrderFilters({ filters }: OrderFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localSearch, setLocalSearch] = React.useState(filters.search || "")

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        updateFilters({ search: localSearch || undefined })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch])

  const updateFilters = React.useCallback(
    (updates: Partial<OrderFilters>) => {
      const newFilters = { ...filters, ...updates }

      // Remove undefined values
      Object.keys(newFilters).forEach((key) => {
        if (newFilters[key as keyof OrderFilters] === undefined) {
          delete newFilters[key as keyof OrderFilters]
        }
      })

      // Update URL search params
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      router.push(`?${params.toString()}`, { scroll: false })
    },
    [filters, router, searchParams]
  )

  const handleStatusChange = (value: string) => {
    updateFilters({ status: value === "all" ? undefined : value })
  }

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ dateFrom: e.target.value || undefined })
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ dateTo: e.target.value || undefined })
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    router.push(window.location.pathname, { scroll: false })
  }

  const hasActiveFilters =
    filters.status ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.search

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="ml-auto"
          >
            <X className="mr-1.5" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search Input */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-muted-foreground">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by order #, customer name, or email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Status
          </label>
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range - From and To in same container */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Date Range
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={filters.dateFrom || ""}
                onChange={handleDateFromChange}
                className="pl-9"
                placeholder="From"
              />
            </div>
            <span className="text-muted-foreground text-sm">to</span>
            <div className="relative flex-1">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={filters.dateTo || ""}
                onChange={handleDateToChange}
                className="pl-9"
                placeholder="To"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {filters.status && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-sm">
              <span className="font-medium">Status:</span>
              <span className="capitalize">{filters.status}</span>
              <button
                onClick={() => updateFilters({ status: undefined })}
                className="ml-1 rounded-sm hover:bg-primary/20"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {filters.search && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-sm">
              <span className="font-medium">Search:</span>
              <span className="max-w-[150px] truncate">{filters.search}</span>
              <button
                onClick={() => {
                  setLocalSearch("")
                  updateFilters({ search: undefined })
                }}
                className="ml-1 rounded-sm hover:bg-primary/20"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {(filters.dateFrom || filters.dateTo) && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-sm">
              <span className="font-medium">Date:</span>
              <span>
                {filters.dateFrom && new Date(filters.dateFrom).toLocaleDateString()}
                {filters.dateFrom && filters.dateTo && " - "}
                {filters.dateTo && new Date(filters.dateTo).toLocaleDateString()}
              </span>
              <button
                onClick={() => updateFilters({ dateFrom: undefined, dateTo: undefined })}
                className="ml-1 rounded-sm hover:bg-primary/20"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
