"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { ChevronDown, ChevronRight, Package, TrendingUp, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { getVariantSalesAction } from "./actions"

interface Product {
  id: string
  name: string
  slug: string
  images: string[]
  category_name: string | null
  total_units: number
  total_revenue: number
  variant_count: number
}

interface VariantSale {
  variant_id: string
  variant_name: string
  options: Record<string, string>
  units_sold: number
  revenue: number
  stock_remaining: number
  price: number
}

interface BestSellersClientProps {
  products: Product[]
}

export function BestSellersClient({ products }: BestSellersClientProps) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [variantData, setVariantData] = useState<Record<string, VariantSale[]>>({})
  const [isPending, startTransition] = useTransition()

  const totalRevenue = products.reduce((sum, p) => sum + p.total_revenue, 0)
  const totalUnits = products.reduce((sum, p) => sum + p.total_units, 0)

  const handleExpand = (productId: string) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null)
      return
    }

    setExpandedProduct(productId)

    if (!variantData[productId]) {
      startTransition(async () => {
        const data = await getVariantSalesAction(productId)
        setVariantData(prev => ({ ...prev, [productId]: data }))
      })
    }
  }

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">{formatPrice(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Units Sold</p>
              <p className="text-xl font-bold">{totalUnits.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Award className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products Tracked</p>
              <p className="text-xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Product Rankings</h3>
          <p className="text-sm text-muted-foreground">Click a product to see variant breakdown</p>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No sales data yet</p>
            <p className="text-sm mt-1">Sales analytics will appear here once orders are placed</p>
          </div>
        ) : (
          <div className="divide-y">
            {products.map((product, index) => {
              const isExpanded = expandedProduct === product.id
              const variants = variantData[product.id]

              return (
                <div key={product.id}>
                  {/* Product Row */}
                  <button
                    onClick={() => handleExpand(product.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    {/* Rank */}
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0",
                      index === 0 && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                      index === 1 && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                      index === 2 && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                      index > 2 && "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>

                    {/* Product Image */}
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      {product.images[0] ? (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category_name || "Uncategorized"} · {product.variant_count} variant{product.variant_count !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="font-semibold">{product.total_units}</p>
                        <p className="text-xs text-muted-foreground">units</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(product.total_revenue)}</p>
                        <p className="text-xs text-muted-foreground">revenue</p>
                      </div>
                    </div>

                    {/* Expand icon */}
                    <div className="shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Mobile stats */}
                  <div className="sm:hidden px-4 pb-2 flex gap-4 text-sm -mt-2">
                    <span className="text-muted-foreground">{product.total_units} units</span>
                    <span className="font-medium">{formatPrice(product.total_revenue)}</span>
                  </div>

                  {/* Variant Breakdown (expanded) */}
                  {isExpanded && (
                    <div className="bg-muted/30 border-t px-4 py-3">
                      {isPending && !variants ? (
                        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Loading variant data...
                        </div>
                      ) : variants && variants.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                            Variant Performance
                          </p>
                          {variants.map((variant, vIndex) => {
                            const maxUnits = variants[0]?.units_sold || 1
                            const barWidth = Math.max((variant.units_sold / maxUnits) * 100, 2)

                            return (
                              <div key={variant.variant_id} className="flex items-center gap-3 py-1.5">
                                <span className={cn(
                                  "text-xs font-bold w-5 text-center shrink-0",
                                  vIndex === 0 ? "text-amber-600" : "text-muted-foreground"
                                )}>
                                  #{vIndex + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium truncate">
                                      {variant.variant_name}
                                      {Object.keys(variant.options).length > 0 && (
                                        <span className="text-muted-foreground font-normal ml-1">
                                          ({Object.values(variant.options).join(" / ")})
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-sm shrink-0 ml-2">
                                      {variant.units_sold} sold · {formatPrice(variant.revenue)}
                                    </span>
                                  </div>
                                  {/* Bar */}
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all",
                                        vIndex === 0 ? "bg-amber-500" : "bg-foreground/20"
                                      )}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      Price: {formatPrice(variant.price)}
                                    </span>
                                    <span className={cn(
                                      "text-xs",
                                      variant.stock_remaining <= 5 ? "text-red-500 font-medium" : "text-muted-foreground"
                                    )}>
                                      {variant.stock_remaining} in stock
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">No variant sales data available</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
