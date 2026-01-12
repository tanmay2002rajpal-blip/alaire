"use server"

import { createClient } from "@/lib/supabase/server"

export interface StockCheckItem {
  productId: string
  variantId?: string
  quantity: number
  name: string
}

export interface StockCheckResult {
  available: boolean
  items: {
    productId: string
    variantId?: string
    name: string
    requested: number
    available: number
    inStock: boolean
  }[]
}

/**
 * Check if all items in cart have sufficient stock
 */
export async function checkStock(items: StockCheckItem[]): Promise<StockCheckResult> {
  const supabase = await createClient()

  const results: StockCheckResult = {
    available: true,
    items: [],
  }

  for (const item of items) {
    let stockQuantity = 0
    let productName = item.name

    if (item.variantId) {
      // Check variant stock
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_quantity, name")
        .eq("id", item.variantId)
        .single()

      stockQuantity = variant?.stock_quantity ?? 0
      if (variant?.name) {
        productName = `${item.name} - ${variant.name}`
      }
    } else {
      // Check product stock (sum of all variants or base stock)
      const { data: variants } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("product_id", item.productId)

      if (variants && variants.length > 0) {
        stockQuantity = variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
      } else {
        // No variants - check product directly
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.productId)
          .single()

        stockQuantity = product?.stock_quantity ?? 0
      }
    }

    const inStock = stockQuantity >= item.quantity

    results.items.push({
      productId: item.productId,
      variantId: item.variantId,
      name: productName,
      requested: item.quantity,
      available: stockQuantity,
      inStock,
    })

    if (!inStock) {
      results.available = false
    }
  }

  return results
}

/**
 * Get stock info for a specific product/variant
 */
export async function getStockInfo(
  productId: string,
  variantId?: string
): Promise<{ quantity: number; lowStock: boolean; outOfStock: boolean }> {
  const supabase = await createClient()

  const LOW_STOCK_THRESHOLD = 5

  let stockQuantity = 0

  if (variantId) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", variantId)
      .single()

    stockQuantity = variant?.stock_quantity ?? 0
  } else {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("product_id", productId)

    if (variants && variants.length > 0) {
      stockQuantity = variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
    }
  }

  return {
    quantity: stockQuantity,
    lowStock: stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD,
    outOfStock: stockQuantity <= 0,
  }
}
