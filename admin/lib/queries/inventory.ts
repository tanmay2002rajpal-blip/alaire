'use server'

import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()

  const page = filters?.page || 1
  const limit = filters?.limit || 25
  const offset = (page - 1) * limit

  // Query product_variants with product and category info
  let query = supabase
    .from('product_variants')
    .select(`
      id,
      name,
      sku,
      price,
      stock_quantity,
      is_active,
      updated_at,
      products!inner (
        id,
        name,
        slug,
        images,
        is_active,
        category_id,
        categories (
          id,
          name
        )
      )
    `, { count: 'exact' })
    .eq('is_active', true)

  // Apply search filter on product name
  if (filters?.search) {
    const searchTerm = '%' + filters.search + '%'
    query = query.or('name.ilike.' + searchTerm + ',sku.ilike.' + searchTerm)
  }

  // Apply category filter
  if (filters?.category_id) {
    query = query.eq('products.category_id', filters.category_id)
  }

  // Apply stock status filter
  if (filters?.stock_status && filters.stock_status !== 'all') {
    switch (filters.stock_status) {
      case 'out_of_stock':
        query = query.eq('stock_quantity', 0)
        break
      case 'low_stock':
        query = query.gt('stock_quantity', 0).lt('stock_quantity', LOW_STOCK_THRESHOLD)
        break
      case 'in_stock':
        query = query.gte('stock_quantity', LOW_STOCK_THRESHOLD)
        break
    }
  }

  // Apply pagination and ordering (low stock first)
  query = query
    .order('stock_quantity', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data: variantsData, error: variantsError, count } = await query

  if (variantsError) {
    console.error('Error fetching inventory:', variantsError)
    throw new Error('Failed to fetch inventory')
  }

  // Transform data
  const items: InventoryItem[] = (variantsData || []).map(variant => {
    const product = variant.products as any
    const category = Array.isArray(product?.categories)
      ? product.categories[0]
      : product?.categories

    return {
      id: variant.id,
      product_id: product?.id || '',
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
      last_updated: variant.updated_at,
    }
  })

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    items,
    total,
    page,
    totalPages,
  }
}

/**
 * Get inventory statistics from product_variants
 */
export async function getInventoryStats(): Promise<InventoryStats> {
  const supabase = await createClient()

  // Get all active variants
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('stock_quantity, price')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching inventory stats:', error)
    throw new Error('Failed to fetch inventory stats')
  }

  const stats: InventoryStats = {
    total_items: variants?.length || 0,
    total_stock_value: 0,
    low_stock_items: 0,
    out_of_stock_items: 0,
    in_stock_items: 0,
  }

  variants?.forEach(variant => {
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
  })

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
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('product_variants')
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId)

    if (error) {
      console.error('Error updating stock:', error)
      return { success: false, error: error.message }
    }

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
  const supabase = await createClient()

  try {
    let updated = 0

    for (const update of updates) {
      const { error } = await supabase
        .from('product_variants')
        .update({
          stock_quantity: update.stock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.variantId)

      if (!error) {
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
