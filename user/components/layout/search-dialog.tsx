"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Clock, Folder, Search } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { searchProducts, type SearchResult } from "@/lib/actions/search"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"

const RECENT_SEARCHES_KEY = "recent-searches"
const MAX_RECENT_SEARCHES = 5

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return
  try {
    const recent = getRecentSearches().filter((s) => s !== query)
    recent.unshift(query)
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES))
    )
  } catch {}
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult>({ products: [], categories: [] })
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load recent searches on mount
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches())
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ products: [], categories: [] })
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const data = await searchProducts(query)
        setResults(data)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback(
    (href: string, searchQuery?: string) => {
      if (searchQuery) {
        saveRecentSearch(searchQuery)
      }
      onOpenChange(false)
      setQuery("")
      router.push(href)
    },
    [router, onOpenChange]
  )

  const handleRecentSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
  }, [])

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
    setRecentSearches([])
  }, [])

  const hasResults = results.products.length > 0 || results.categories.length > 0
  const showRecent = !query && recentSearches.length > 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search for products and categories"
    >
      <CommandInput
        placeholder="Search products..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}

        {!isLoading && query.length >= 2 && !hasResults && (
          <CommandEmpty>No results found for &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {/* Recent Searches */}
        {showRecent && (
          <CommandGroup
            heading={
              <div className="flex items-center justify-between">
                <span>Recent Searches</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            }
          >
            {recentSearches.map((search) => (
              <CommandItem
                key={search}
                value={search}
                onSelect={() => handleRecentSearch(search)}
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {search}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Categories */}
        {results.categories.length > 0 && (
          <CommandGroup heading="Categories">
            {results.categories.map((category) => (
              <CommandItem
                key={category.id}
                value={`category-${category.slug}`}
                onSelect={() => handleSelect(`/categories/${category.slug}`, query)}
              >
                <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                {category.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.categories.length > 0 && results.products.length > 0 && (
          <CommandSeparator />
        )}

        {/* Products */}
        {results.products.length > 0 && (
          <CommandGroup heading="Products">
            {results.products.map((product) => (
              <CommandItem
                key={product.id}
                value={`product-${product.slug}`}
                onSelect={() => handleSelect(`/products/${product.slug}`, query)}
                className="flex items-center gap-3"
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* View all results */}
        {query.length >= 2 && hasResults && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="view-all"
                onSelect={() => handleSelect(`/products?search=${encodeURIComponent(query)}`, query)}
              >
                <Search className="mr-2 h-4 w-4" />
                View all results for &ldquo;{query}&rdquo;
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
