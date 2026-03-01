'use server'

import { ObjectId } from 'mongodb'
import { getProductVariantsCollection, getProductsCollection, getCategoriesCollection } from '@/lib/db/collections'
import { toObjectId, paginate, totalPages } from '@/lib/db/helpers'

export interface InventoryItem {
  id: string
  product_id: string
  product_name: string
  product_slug: string
  product_image: string | null
  category_name: string | null
  sku: string | null
  variant_name: string | null
  current_stock: number
  low_stock_threshold: number | null
  price: number
  is_active: boolean
  last_updated: string
}

export interface InventoryFilters {
  search?: string
  stock_status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  category_id?: string
  page?: number
  limit?: number
}

export interface InventoryStats {
  total_items: number
  total_stock_value: number
  low_stock_items: number
  out_of_stock_items: number
  in_stock_items: number
}

export interface PaginatedInventory {
  items: InventoryItem[]
  total: number
  page: number
  totalPages: number
}

const LOW_STOCK_THRESHOLD = 10

/**
 * Get paginated inventory items with filters
 * Inventory is tracked at the variant level
 */
export async function getInventory(filters?: InventoryFilters): Promise<PaginatedInventory> {
  const variantsCol = await getProductVariantsCollection()
  const productsCol = await getProductsCollection()

  const { skip, limit: lim, page } = paginate(filters?.page, filters?.limit || 25)

  // Build variant filter
  const variantFilter: Record<string, any> = { is_active: true }

  if (filters?.search) {
    variantFilter.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { sku: { $regex: filters.search, $options: 'i' } },
    ]
  }

  if (filters?.stock_status && filters.stock_status !== 'all') {
    switch (filters.stock_status) {
      case 'out_of_stock':
        variantFilter.stock_quantity = 0
        break
      case 'low_stock':
        variantFilter.stock_quantity = { $gt: 0, $lt: LOW_STOCK_THRESHOLD }
        break
      case 'in_stock':
        variantFilter.stock_quantity = { $gte: LOW_STOCK_THRESHOLD }
        break
    }
  }

  // If filtering by category, get product IDs first
  if (filters?.category_id) {
    const categoryProducts = await productsCol.find(
      { category_id: toObjectId(filters.category_id) },
      { projection: { _id: 1 } }
    ).toArray()
    variantFilter.product_id = { $in: categoryProducts.map(p => p._id) }
  }

  const [variantsData, total] = await Promise.all([
    variantsCol.find(variantFilter).sort({ stock_quantity: 1 }).skip(skip).limit(lim).toArray(),
    variantsCol.countDocuments(variantFilter),
  ])

  // Get products and categories for these variants
  const productIds = [...new Set(variantsData.map(v => v.product_id))]
  const products = productIds.length > 0
    ? await productsCol.find(
        { _id: { $in: productIds } },
        { projection: { name: 1, slug: 1, images: 1, category_id: 1 } }
      ).toArray()
    : []

  const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))] as ObjectId[]
  const categories = categoryIds.length > 0
    ? await (async () => {
        const catsCol = await getCategoriesCollection()
        return catsCol.find({ _id: { $in: categoryIds } }, { projection: { name: 1 } }).toArray()
      })()
    : []

  const productMap = new Map(products.map(p => [p._id.toString(), p]))
  const categoryMap = new Map(categories.map(c => [c._id.toString(), c]))

  const items: InventoryItem[] = variantsData.map(variant => {
    const product = productMap.get(variant.product_id.toString())
    const category = product?.category_id ? categoryMap.get(product.category_id.toString()) : null

    return {
      id: variant._id.toString(),
      product_id: product?._id.toString() || '',
      product_name: product?.name || 'Unknown',
      product_slug: product?.slug || '',
      product_image: product?.images?.[0] || null,
      category_name: category?.name || null,
      sku: variant.sku,
      variant_name: variant.name,
      current_stock: variant.stock_quantity || 0,
      low_stock_threshold: LOW_STOCK_THRESHOLD,
      price: variant.price || 0,
      is_active: variant.is_active,
      last_updated: variant.updated_at.toISOString(),
    }
  })

  return {
    items,
    total,
    page,
    totalPages: totalPages(total, lim),
  }
}

/**
 * Get inventory statistics from product_variants
 */
export async function getInventoryStats(): Promise<InventoryStats> {
  const variantsCol = await getProductVariantsCollection()

  const variants = await variantsCol.find(
    { is_active: true },
    { projection: { stock_quantity: 1, price: 1 } }
  ).toArray()

  const stats: InventoryStats = {
    total_items: variants.length,
    total_stock_value: 0,
    low_stock_items: 0,
    out_of_stock_items: 0,
    in_stock_items: 0,
  }

  for (const variant of variants) {
    const stock = variant.stock_quantity || 0
    const price = variant.price || 0

    stats.total_stock_value += stock * price

    if (stock === 0) {
      stats.out_of_stock_items++
    } else if (stock < LOW_STOCK_THRESHOLD) {
      stats.low_stock_items++
    } else {
      stats.in_stock_items++
    }
  }

  return stats
}

/**
 * Get stock history for a variant
 */
export async function getStockHistory(variantId: string): Promise<{
  date: string
  stock: number
  change: number
  reason: string
}[]> {
  // For now, return empty array - stock history would require a separate table
  return []
}

/**
 * Update stock for a variant
 */
export async function updateStock(
  variantId: string,
  newStock: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const variantsCol = await getProductVariantsCollection()

  try {
    await variantsCol.updateOne(
      { _id: toObjectId(variantId) },
      { $set: { stock_quantity: newStock, updated_at: new Date() } }
    )

    return { success: true }
  } catch (error) {
    console.error('Error updating stock:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update stock',
    }
  }
}

/**
 * Bulk update stock for multiple variants
 */
export async function bulkUpdateStock(
  updates: { variantId: string; stock: number }[]
): Promise<{ success: boolean; error?: string; updated: number }> {
  const variantsCol = await getProductVariantsCollection()

  try {
    let updated = 0

    for (const update of updates) {
      const result = await variantsCol.updateOne(
        { _id: toObjectId(update.variantId) },
        { $set: { stock_quantity: update.stock, updated_at: new Date() } }
      )

      if (result.modifiedCount > 0) {
        updated++
      }
    }

    return { success: true, updated }
  } catch (error) {
    console.error('Error bulk updating stock:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update stock',
      updated: 0,
    }
  }
}
