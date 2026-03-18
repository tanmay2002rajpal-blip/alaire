'use server'

import { ObjectId } from 'mongodb'
import { getProductsCollection, getProductVariantsCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'

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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const products = await getProductsCollection()

    if (!data.name || !data.slug) {
      return { success: false, error: 'Product name and slug are required' }
    }

    const now = new Date()
    const productId = new ObjectId()

    await products.insertOne({
      _id: productId,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      category_id: data.category_id ? toObjectId(data.category_id) : null,
      base_price: data.base_price ?? null,
      is_active: data.is_active,
      images: data.images || [],
      has_variants: data.has_variants ?? false,
      created_at: now,
      updated_at: now,
    })

    // Handle variants if provided
    if (data.variants && data.variants.length > 0) {
      const variantsCol = await getProductVariantsCollection()
      const variantDocs = data.variants.map(variant => ({
        _id: new ObjectId(),
        product_id: productId,
        name: variant.name,
        sku: variant.sku || null,
        price: variant.price,
        compare_at_price: variant.compare_at_price ?? null,
        stock_quantity: variant.stock_quantity,
        options: variant.options || {},
        image_url: variant.image_url || null,
        is_active: variant.is_active ?? true,
        created_at: now,
        updated_at: now,
      }))
      await variantsCol.insertMany(variantDocs)
    }

    revalidatePath('/products')
    revalidatePath('/dashboard')

    return { success: true, productId: productId.toString() }
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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!id) {
      return { success: false, error: 'Product ID is required' }
    }

    if (!data.name || !data.slug) {
      return { success: false, error: 'Product name and slug are required' }
    }

    const products = await getProductsCollection()
    const productOid = toObjectId(id)
    const now = new Date()

    await products.updateOne(
      { _id: productOid },
      {
        $set: {
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          category_id: data.category_id ? toObjectId(data.category_id) : null,
          base_price: data.base_price ?? null,
          is_active: data.is_active,
          images: data.images || [],
          has_variants: data.has_variants ?? false,
          updated_at: now,
        },
      }
    )

    // Handle variant updates if provided
    if (data.variants) {
      const variantsCol = await getProductVariantsCollection()

      // Get existing variants
      const existingVariants = await variantsCol.find(
        { product_id: productOid },
        { projection: { _id: 1 } }
      ).toArray()

      const existingIds = new Set(existingVariants.map(v => v._id.toString()))
      const updateIds = new Set(data.variants.filter(v => v.id).map(v => v.id))

      // Delete variants that are no longer in the list
      const toDelete = Array.from(existingIds).filter(variantId => !updateIds.has(variantId))
      if (toDelete.length > 0) {
        await variantsCol.deleteMany({ _id: { $in: toDelete.map(toObjectId) } })
      }

      // Update or insert variants
      for (const variant of data.variants) {
        const variantData = {
          product_id: productOid,
          name: variant.name,
          sku: variant.sku || null,
          price: variant.price,
          compare_at_price: variant.compare_at_price ?? null,
          stock_quantity: variant.stock_quantity,
          options: variant.options || {},
          image_url: variant.image_url || null,
          is_active: variant.is_active ?? true,
          updated_at: now,
        }

        if (variant.id) {
          await variantsCol.updateOne(
            { _id: toObjectId(variant.id) },
            { $set: variantData }
          )
        } else {
          await variantsCol.insertOne({
            _id: new ObjectId(),
            ...variantData,
            created_at: now,
          })
        }
      }
    }

    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    revalidatePath('/dashboard')

    return { success: true, productId: id }
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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!id) {
      return { success: false, error: 'Product ID is required' }
    }

    const products = await getProductsCollection()

    await products.updateOne(
      { _id: toObjectId(id) },
      { $set: { is_active: false, updated_at: new Date() } }
    )

    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    revalidatePath('/dashboard')

    return { success: true }
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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!id) {
      return { success: false, error: 'Product ID is required' }
    }

    const products = await getProductsCollection()
    const product = await products.findOne(
      { _id: toObjectId(id) },
      { projection: { is_active: 1 } }
    )

    if (!product) {
      return { success: false, error: 'Product not found' }
    }

    const newStatus = !product.is_active

    await products.updateOne(
      { _id: toObjectId(id) },
      { $set: { is_active: newStatus, updated_at: new Date() } }
    )

    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    revalidatePath('/dashboard')

    return { success: true, newStatus }
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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!ids || ids.length === 0) {
      return { success: false, error: 'No product IDs provided' }
    }

    const products = await getProductsCollection()

    await products.updateMany(
      { _id: { $in: ids.map(toObjectId) } },
      { $set: { is_active: false, updated_at: new Date() } }
    )

    revalidatePath('/products')
    revalidatePath('/dashboard')
    revalidatePath('/inventory')

    return { success: true }
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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!ids || ids.length === 0) {
      return { success: false, error: 'No product IDs provided' }
    }

    const products = await getProductsCollection()

    await products.updateMany(
      { _id: { $in: ids.map(toObjectId) } },
      { $set: { is_active: isActive, updated_at: new Date() } }
    )

    revalidatePath('/products')
    revalidatePath('/dashboard')
    revalidatePath('/inventory')

    return { success: true }
  } catch (error) {
    console.error('Error in bulkUpdateProductStatusAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
