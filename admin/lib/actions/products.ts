'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  productId?: string
  error?: string
}

interface ToggleStatusResult {
  success: boolean
  newStatus?: boolean
  error?: string
}

interface VariantData {
  id?: string
  name: string
  sku?: string | null
  price: number
  compare_at_price?: number | null
  stock_quantity: number
  options?: any
  image_url?: string | null
  is_active?: boolean
}

interface CreateProductData {
  name: string
  slug: string
  description?: string
  category_id?: string | null
  base_price?: number | null
  is_active: boolean
  images: string[]
  has_variants: boolean
  variants?: VariantData[]
}

interface UpdateProductData extends Partial<CreateProductData> {
  name: string
  slug: string
}

/**
 * Server action to create a new product
 */
export async function createProductAction(data: CreateProductData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Validate required fields
    if (!data.name || !data.slug) {
      return {
        success: false,
        error: 'Product name and slug are required',
      }
    }

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        category_id: data.category_id || null,
        base_price: data.base_price || null,
        is_active: data.is_active,
        images: data.images || [],
        has_variants: data.has_variants ?? false,
      })
      .select('id')
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      return {
        success: false,
        error: productError.message,
      }
    }

    // Handle variants if provided
    if (data.variants && data.variants.length > 0) {
      const variantInserts = data.variants.map((variant) => ({
        product_id: product.id,
        name: variant.name,
        sku: variant.sku || null,
        price: variant.price,
        compare_at_price: variant.compare_at_price || null,
        stock_quantity: variant.stock_quantity,
        options: variant.options || {},
        image_url: variant.image_url || null,
        is_active: variant.is_active ?? true,
      }))

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantInserts)

      if (variantsError) {
        console.error('Error creating variants:', variantsError)
        // Don't fail the whole operation, just log
      }
    }

    // Revalidate product pages
    revalidatePath('/products')
    revalidatePath('/dashboard')

    return {
      success: true,
      productId: product.id,
    }
  } catch (error) {
    console.error('Error in createProductAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to update an existing product
 */
export async function updateProductAction(
  id: string,
  data: UpdateProductData
): Promise<ActionResult> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Product ID is required',
      }
    }

    const supabase = await createClient()

    // Validate required fields
    if (!data.name || !data.slug) {
      return {
        success: false,
        error: 'Product name and slug are required',
      }
    }

    // Update product
    const { error: productError } = await supabase
      .from('products')
      .update({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        category_id: data.category_id || null,
        base_price: data.base_price || null,
        is_active: data.is_active,
        images: data.images || [],
        has_variants: data.has_variants ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (productError) {
      console.error('Error updating product:', productError)
      return {
        success: false,
        error: productError.message,
      }
    }

    // Handle variant updates if provided
    if (data.variants) {
      // Get existing variants
      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', id)

      const existingIds = new Set(existingVariants?.map((v) => v.id) || [])
      const updateIds = new Set(
        data.variants.filter((v) => v.id).map((v) => v.id)
      )

      // Delete variants that are no longer in the list
      const toDelete = Array.from(existingIds).filter((variantId) => !updateIds.has(variantId))
      if (toDelete.length > 0) {
        await supabase.from('product_variants').delete().in('id', toDelete)
      }

      // Update or insert variants
      for (const variant of data.variants) {
        const variantData = {
          product_id: id,
          name: variant.name,
          sku: variant.sku || null,
          price: variant.price,
          compare_at_price: variant.compare_at_price || null,
          stock_quantity: variant.stock_quantity,
          options: variant.options || {},
          image_url: variant.image_url || null,
          is_active: variant.is_active ?? true,
        }

        if (variant.id) {
          // Update existing variant
          await supabase
            .from('product_variants')
            .update(variantData)
            .eq('id', variant.id)
        } else {
          // Insert new variant
          await supabase.from('product_variants').insert(variantData)
        }
      }
    }

    // Revalidate product pages
    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    revalidatePath('/dashboard')

    return {
      success: true,
      productId: id,
    }
  } catch (error) {
    console.error('Error in updateProductAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to soft delete a product
 */
export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Product ID is required',
      }
    }

    const supabase = await createClient()

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('products')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate product pages
    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteProductAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to toggle product active status
 */
export async function toggleProductStatusAction(
  id: string
): Promise<ToggleStatusResult> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Product ID is required',
      }
    }

    const supabase = await createClient()

    // Get current status
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching product:', fetchError)
      return {
        success: false,
        error: fetchError.message,
      }
    }

    // Toggle the status
    const newStatus = !product.is_active

    const { error: updateError } = await supabase
      .from('products')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error toggling product status:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Revalidate product pages
    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    revalidatePath('/dashboard')

    return {
      success: true,
      newStatus,
    }
  } catch (error) {
    console.error('Error in toggleProductStatusAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to bulk delete products
 */
export async function bulkDeleteProductsAction(ids: string[]): Promise<ActionResult> {
  try {
    if (!ids || ids.length === 0) {
      return {
        success: false,
        error: 'No product IDs provided',
      }
    }

    const supabase = await createClient()

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('products')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (error) {
      console.error('Error bulk deleting products:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate product pages
    revalidatePath('/products')
    revalidatePath('/dashboard')
    revalidatePath('/inventory')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in bulkDeleteProductsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to bulk update product status
 */
export async function bulkUpdateProductStatusAction(
  ids: string[],
  isActive: boolean
): Promise<ActionResult> {
  try {
    if (!ids || ids.length === 0) {
      return {
        success: false,
        error: 'No product IDs provided',
      }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('products')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (error) {
      console.error('Error bulk updating product status:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate product pages
    revalidatePath('/products')
    revalidatePath('/dashboard')
    revalidatePath('/inventory')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in bulkUpdateProductStatusAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
