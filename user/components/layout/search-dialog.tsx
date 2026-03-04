"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Clock, Folder, Search, X, ArrowRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { searchProducts, type SearchResult } from "@/lib/actions/search"
import gsap from "gsap"

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
  const [isRendered, setIsRendered] = useState(false)
  
  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle mounting and animation sequence
  useEffect(() => {
    if (open) {
      setIsRendered(true)
      setRecentSearches(getRecentSearches())
      // Lock scroll
      document.body.style.overflow = "hidden"

      // Animate in
      setTimeout(() => {
        if (overlayRef.current && contentRef.current) {
          gsap.fromTo(
            overlayRef.current,
            { opacity: 0, backdropFilter: "blur(0px)" },
            { opacity: 1, backdropFilter: "blur(24px)", duration: 0.5, ease: "power3.out" }
          )
          gsap.fromTo(
            contentRef.current,
            { y: -40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, delay: 0.1, ease: "back.out(1.2)" }
          )
          inputRef.current?.focus()
        }
      }, 50)
    } else {
      document.body.style.overflow = ""
      if (overlayRef.current && contentRef.current) {
        gsap.to(contentRef.current, { y: -20, opacity: 0, duration: 0.3, ease: "power2.in" })
        gsap.to(overlayRef.current, {
          opacity: 0,
          backdropFilter: "blur(0px)",
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: () => setIsRendered(false)
        })
      } else {
        setIsRendered(false)
      }
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
      setTimeout(() => {
        setQuery("")
        router.push(href)
      }, 400) // wait for animation
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

  if (!isRendered && !open) return null

  const hasResults = results.products.length > 0 || results.categories.length > 0
  const showRecent = !query && recentSearches.length > 0

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col bg-white/80 dark:bg-black/80 backdrop-blur-3xl transition-colors"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={() => onOpenChange(false)}
          className="p-3 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 rounded-full transition-colors flex items-center justify-center group"
          aria-label="Close search"
        >
          <X className="w-6 h-6 text-foreground group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div ref={contentRef} className="container mx-auto px-4 pt-24 pb-12 flex-1 overflow-y-auto w-full max-w-5xl">
        {/* Large Elegant Search Input */}
        <div className="relative group mb-16">
          <input
            ref={inputRef}
            type="text"
            placeholder="What are you looking for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-4xl sm:text-5xl md:text-6xl font-serif tracking-tight text-foreground placeholder:text-muted-foreground/40 py-4"
            autoComplete="off"
            spellCheck="false"
          />
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-muted-foreground/20">
            <div 
              className="absolute bottom-0 left-0 h-full bg-foreground transition-all duration-700 ease-out"
              style={{ width: query ? '100%' : '0%' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="md:col-span-8 space-y-12">
            {isLoading && (
              <div className="flex items-center space-x-3 text-muted-foreground animate-pulse">
                <Search className="w-5 h-5 animate-spin" />
                <span className="text-lg">Searching collections...</span>
              </div>
            )}

            {!isLoading && query.length >= 2 && !hasResults && (
              <div className="text-xl text-muted-foreground font-medium">
                We couldn&apos;t find anything matching &quot;{query}&quot;.
                <p className="text-base mt-2 opacity-60">Try checking your spelling or using less specific terms.</p>
              </div>
            )}

            {/* Products Grid */}
            {results.products.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Products</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {results.products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect(`/products/${product.slug}`, query)}
                      className="group flex items-center gap-4 p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="relative h-20 w-20 overflow-hidden bg-muted rounded-lg shrink-0">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="80px"
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Search className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="font-medium text-lg text-foreground truncate">{product.name}</span>
                        <span className="text-sm text-primary mt-1">{formatPrice(product.price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.length >= 2 && hasResults && (
              <button
                onClick={() => handleSelect(`/products?search=${encodeURIComponent(query)}`, query)}
                className="group flex items-center gap-2 text-lg font-medium text-primary hover:opacity-80 transition-opacity mt-8"
              >
                View all results for &quot;{query}&quot;
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* Sidebar / Categories / Recent */}
          <div className="md:col-span-4 space-y-12">
            {/* Recent Searches */}
            {showRecent && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Recent</h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleRecentSearch(search)}
                      className="inline-flex items-center px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-sm font-medium"
                    >
                      <Clock className="mr-2 h-3 w-3 opacity-50" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {results.categories.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Collections</h3>
                <div className="flex flex-col gap-1">
                  {results.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleSelect(`/categories/${category.slug}`, query)}
                      className="group flex items-center justify-between px-4 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
