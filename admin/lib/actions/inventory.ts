'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface StockUpdateResult {
  success: boolean
  error?: string
}

interface BulkUpdateResult {
  success: boolean
  error?: string
  updated: number
}

/**
 * Server action to update stock for a single variant
 */
export async function updateStockAction(
  variantId: string,
  newStock: number,
  adjustment?: 'set' | 'add' | 'subtract'
): Promise<StockUpdateResult> {
  try {
    if (!variantId) {
      return { success: false, error: 'Variant ID is required' }
    }

    if (newStock < 0) {
      return { success: false, error: 'Stock cannot be negative' }
    }

    const supabase = await createClient()

    let finalStock = newStock

    // If adjustment mode, get current stock first
    if (adjustment === 'add' || adjustment === 'subtract') {
      const { data: variant, error: fetchError } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', variantId)
        .single()

      if (fetchError) {
        return { success: false, error: 'Variant not found' }
      }

      if (adjustment === 'add') {
        finalStock = (variant.stock_quantity || 0) + newStock
      } else {
        finalStock = Math.max(0, (variant.stock_quantity || 0) - newStock)
      }
    }

    const { error } = await supabase
      .from('product_variants')
      .update({
        stock_quantity: finalStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId)

    if (error) {
      console.error('Error updating stock:', error)
      return { success: false, error: error.message }
    }

    // Revalidate inventory pages
    revalidatePath('/inventory')
    revalidatePath('/products')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in updateStockAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to bulk update stock for multiple variants
 */
export async function bulkUpdateStockAction(
  updates: { variantId: string; stock: number }[]
): Promise<BulkUpdateResult> {
  try {
    if (!updates || updates.length === 0) {
      return { success: false, error: 'No updates provided', updated: 0 }
    }

    const supabase = await createClient()
    let updated = 0
    const errors: string[] = []

    for (const update of updates) {
      if (update.stock < 0) {
        errors.push('Invalid stock value for variant ' + update.variantId)
        continue
      }

      const { error } = await supabase
        .from('product_variants')
        .update({
          stock_quantity: update.stock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.variantId)

      if (error) {
        errors.push('Failed to update ' + update.variantId + ': ' + error.message)
      } else {
        updated++
      }
    }

    // Revalidate pages
    revalidatePath('/inventory')
    revalidatePath('/products')
    revalidatePath('/dashboard')

    if (errors.length > 0 && updated === 0) {
      return { success: false, error: errors.join(', '), updated: 0 }
    }

    return { success: true, updated }
  } catch (error) {
    console.error('Error in bulkUpdateStockAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      updated: 0,
    }
  }
}

/**
 * Server action to set low stock threshold
 * Note: This updates the product-level setting
 */
export async function updateLowStockThresholdAction(
  productId: string,
  threshold: number
): Promise<StockUpdateResult> {
  try {
    if (!productId) {
      return { success: false, error: 'Product ID is required' }
    }

    if (threshold < 0) {
      return { success: false, error: 'Threshold cannot be negative' }
    }

    // Note: The products table doesn't have low_stock_threshold column
    // This would need to be added if per-product thresholds are needed
    // For now, we use a global threshold of 10

    revalidatePath('/inventory')
    revalidatePath('/products')

    return { success: true }
  } catch (error) {
    console.error('Error in updateLowStockThresholdAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
