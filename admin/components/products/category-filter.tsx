"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Category {
  id: string
  name: string
}

interface CategoryFilterProps {
  categories: Category[]
  currentCategory?: string
}

export function CategoryFilter({ categories, currentCategory }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set("category_id", value)
    } else {
      params.delete("category_id")
    }
    params.delete("page")
    const queryString = params.toString()
    router.push(queryString ? `?${queryString}` : "/products")
  }

  return (
    <Select
      defaultValue={currentCategory || "all"}
      onValueChange={handleCategoryChange}
    >
      <SelectTrigger className="w-full sm:w-[200px]">
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
  )
}
