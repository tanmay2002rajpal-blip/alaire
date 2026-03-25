"use client"

import { cn } from "@/lib/utils"

interface CategoryTabsProps {
  categories: { id: string; name: string }[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  className?: string
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto no-scrollbar",
        className
      )}
    >
      <button
        role="tab"
        aria-selected={activeCategory === "all"}
        onClick={() => onCategoryChange("all")}
        className={cn(
          "shrink-0 px-4 py-2 text-sm font-medium transition-all border-b-2",
          activeCategory === "all"
            ? "border-accent text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={activeCategory === cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={cn(
            "shrink-0 px-4 py-2 text-sm font-medium transition-all border-b-2",
            activeCategory === cat.id
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
