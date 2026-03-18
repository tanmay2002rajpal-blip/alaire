'use server'

import { getProductVariantsCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'

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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!variantId) {
      return { success: false, error: 'Variant ID is required' }
    }

    if (newStock < 0) {
      return { success: false, error: 'Stock cannot be negative' }
    }

    const variantsCol = await getProductVariantsCollection()

    let finalStock = newStock

    // If adjustment mode, get current stock first
    if (adjustment === 'add' || adjustment === 'subtract') {
      const variant = await variantsCol.findOne(
        { _id: toObjectId(variantId) },
        { projection: { stock_quantity: 1 } }
      )

      if (!variant) {
        return { success: false, error: 'Variant not found' }
      }

      if (adjustment === 'add') {
        finalStock = (variant.stock_quantity || 0) + newStock
      } else {
        finalStock = Math.max(0, (variant.stock_quantity || 0) - newStock)
      }
    }

    await variantsCol.updateOne(
      { _id: toObjectId(variantId) },
      { $set: { stock_quantity: finalStock, updated_at: new Date() } }
    )

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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized', updated: 0 }

    if (!updates || updates.length === 0) {
      return { success: false, error: 'No updates provided', updated: 0 }
    }

    const variantsCol = await getProductVariantsCollection()
    let updated = 0
    const errors: string[] = []

    for (const update of updates) {
      if (update.stock < 0) {
        errors.push('Invalid stock value for variant ' + update.variantId)
        continue
      }

      const result = await variantsCol.updateOne(
        { _id: toObjectId(update.variantId) },
        { $set: { stock_quantity: update.stock, updated_at: new Date() } }
      )

      if (result.modifiedCount > 0) {
        updated++
      }
    }

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
 */
export async function updateLowStockThresholdAction(
  productId: string,
  threshold: number
): Promise<StockUpdateResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!productId) {
      return { success: false, error: 'Product ID is required' }
    }

    if (threshold < 0) {
      return { success: false, error: 'Threshold cannot be negative' }
    }

    // Note: We use a global threshold of 10 for now
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
