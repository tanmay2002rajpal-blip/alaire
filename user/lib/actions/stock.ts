"use server"

import { getDb } from "@/lib/db/client"

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

export async function checkStock(items: StockCheckItem[]): Promise<StockCheckResult> {
  const db = await getDb()

  const results: StockCheckResult = {
    available: true,
    items: [],
  }

  for (const item of items) {
    let stockQuantity = 0
    let productName = item.name

    if (item.variantId) {
      const variant = await db
        .collection("product_variants")
        .findOne({ $expr: { $eq: [{ $toString: "$_id" }, item.variantId] } })

      stockQuantity = variant?.stock_quantity ?? 0
      if (variant?.name) {
        productName = `${item.name} - ${variant.name}`
      }
    } else {
      const variants = await db
        .collection("product_variants")
        .find({ product_id: item.productId })
        .toArray()

      if (variants.length > 0) {
        stockQuantity = variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
      } else {
        const product = await db
          .collection("products")
          .findOne({ $expr: { $eq: [{ $toString: "$_id" }, item.productId] } })

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

export async function getStockInfo(
  productId: string,
  variantId?: string
): Promise<{ quantity: number; lowStock: boolean; outOfStock: boolean }> {
  const db = await getDb()

  const LOW_STOCK_THRESHOLD = 5
  let stockQuantity = 0

  if (variantId) {
    const variant = await db
      .collection("product_variants")
      .findOne({ $expr: { $eq: [{ $toString: "$_id" }, variantId] } })

    stockQuantity = variant?.stock_quantity ?? 0
  } else {
    const variants = await db
      .collection("product_variants")
      .find({ product_id: productId })
      .toArray()

    if (variants.length > 0) {
      stockQuantity = variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
    }
  }

  return {
    quantity: stockQuantity,
    lowStock: stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD,
    outOfStock: stockQuantity <= 0,
  }
}
