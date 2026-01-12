"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import type { Category } from "@/types"

interface ProductFiltersProps {
  categories: Category[]
}

const PRICE_RANGES = [
  { label: "Under ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 - ₹2,500", min: 1000, max: 2500 },
  { label: "₹2,500 - ₹5,000", min: 2500, max: 5000 },
  { label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
  { label: "Over ₹10,000", min: 10000, max: null },
]

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name: A to Z", value: "name_asc" },
]

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedCategory = searchParams.get("category")
  const selectedPriceMin = searchParams.get("price_min")
  const selectedPriceMax = searchParams.get("price_max")
  const selectedSort = searchParams.get("sort") || "newest"

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, value)
        }
      })

      return newSearchParams.toString()
    },
    [searchParams]
  )

  const handleCategoryChange = (slug: string, checked: boolean) => {
    const queryString = createQueryString({
      category: checked ? slug : null,
    })
    router.push(`/products?${queryString}`)
  }

  const handlePriceChange = (min: number, max: number | null, checked: boolean) => {
    const queryString = createQueryString({
      price_min: checked ? min.toString() : null,
      price_max: checked && max ? max.toString() : null,
    })
    router.push(`/products?${queryString}`)
  }

  const handleSortChange = (value: string) => {
    const queryString = createQueryString({ sort: value })
    router.push(`/products?${queryString}`)
  }

  const clearFilters = () => {
    router.push("/products")
  }

  const hasActiveFilters = selectedCategory || selectedPriceMin || selectedPriceMax

  // Filters content JSX - shared between desktop and mobile
  const filtersContent = (
    <div className="space-y-6">
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}

      <Accordion type="multiple" defaultValue={["categories", "price", "sort"]} className="w-full">
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium">
            Categories
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.slug}`}
                    checked={selectedCategory === category.slug}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.slug, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`category-${category.slug}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">
            Price Range
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {PRICE_RANGES.map((range) => {
                const isChecked =
                  selectedPriceMin === range.min.toString() &&
                  (range.max === null
                    ? !selectedPriceMax
                    : selectedPriceMax === range.max.toString())

                return (
                  <div key={range.label} className="flex items-center space-x-2">
                    <Checkbox
                      id={`price-${range.min}-${range.max}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handlePriceChange(range.min, range.max, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`price-${range.min}-${range.max}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {range.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Sort */}
        <AccordionItem value="sort">
          <AccordionTrigger className="text-sm font-medium">
            Sort By
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {SORT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sort-${option.value}`}
                    checked={selectedSort === option.value}
                    onCheckedChange={() => handleSortChange(option.value)}
                  />
                  <Label
                    htmlFor={`sort-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )

  return (
    <>
      {/* Desktop Filters */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24">
          <h2 className="mb-4 text-lg font-semibold">Filters</h2>
          {filtersContent}
        </div>
      </aside>

      {/* Mobile Filters */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs text-white">
                  Active
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <Separator className="my-4" />
            {filtersContent}
          </SheetContent>
        </Sheet>

        {/* Mobile Sort */}
        <select
          value={selectedSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
