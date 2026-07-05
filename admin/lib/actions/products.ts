'use server'

import { ObjectId, MongoServerError } from 'mongodb'
import {
  getProductsCollection,
  getProductVariantsCollection,
  getProductOptionsCollection,
} from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import type { ProductDoc, ProductVariantDoc } from '@/lib/db/types'
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
  stock_quantity?: number | null
  is_active: boolean
  images: string[]
  has_variants: boolean
  variants?: VariantData[]
}

/**
 * Build product_options documents from variant.options.
 * variant.options is a Record<string, string> like { Size: 'M', Color: 'Maroon' }.
 * The storefront reads product_options ({ product_id, name, values, position }).
 */
function buildProductOptionDocs(productId: ObjectId, variants?: VariantData[]) {
  const optionMap = new Map<string, string[]>()

  for (const variant of variants || []) {
    const opts = variant.options
    if (!opts || typeof opts !== 'object' || Array.isArray(opts)) continue
    for (const [name, rawValue] of Object.entries(opts)) {
      if (rawValue == null || rawValue === '') continue
      const value = String(rawValue)
      if (!optionMap.has(name)) optionMap.set(name, [])
      const values = optionMap.get(name)!
      if (!values.includes(value)) values.push(value)
    }
  }

  let position = 0
  const docs: {
    _id: ObjectId
    product_id: ObjectId
    name: string
    values: string[]
    position: number
  }[] = []
  for (const [name, values] of optionMap) {
    docs.push({ _id: new ObjectId(), product_id: productId, name, values, position: position++ })
  }
  return docs
}

/**
 * Find a slug not already used by any product (including soft-deleted ones),
 * auto-suffixing -2/-3/... to dedupe. Optionally excludes a product id (for updates).
 */
async function dedupeSlug(
  products: Awaited<ReturnType<typeof getProductsCollection>>,
  desiredSlug: string,
  excludeId?: ObjectId
): Promise<string> {
  let candidate = desiredSlug
  let suffix = 2
  // Loop until we find a candidate not taken by another product.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query: Record<string, unknown> = { slug: candidate }
    if (excludeId) query._id = { $ne: excludeId }
    const existing = await products.findOne(query, { projection: { _id: 1 } })
    if (!existing) return candidate
    candidate = `${desiredSlug}-${suffix}`
    suffix += 1
  }
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
    const hasVariants = (data.variants && data.variants.length > 0) || false

    // Dedupe slug against ALL products (including soft-deleted) so we never
    // collide on the unique index; auto-suffix -2/-3/... when needed.
    const slug = await dedupeSlug(products, data.slug)

    try {
      await products.insertOne({
        _id: productId,
        name: data.name,
        slug,
        description: data.description || null,
        category_id: data.category_id ? toObjectId(data.category_id) : null,
        base_price: data.base_price ?? null,
        // Variantless products need product-level stock to be purchasable.
        stock_quantity: hasVariants ? null : (data.stock_quantity ?? 0),
        is_active: data.is_active,
        images: data.images || [],
        // Derive from actual variants, not the client flag, so a product created
        // with variants is correctly marked has_variants.
        has_variants: hasVariants,
        created_at: now,
        updated_at: now,
      } as ProductDoc)
    } catch (insertError) {
      if (insertError instanceof MongoServerError && insertError.code === 11000) {
        return { success: false, error: 'A product with this URL slug already exists.' }
      }
      throw insertError
    }

    // Handle variants if provided. If any variant write fails, roll back the
    // just-inserted product so no half-created product remains.
    if (data.variants && data.variants.length > 0) {
      try {
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

        // Derive storefront product_options from variant options.
        const optionDocs = buildProductOptionDocs(productId, data.variants)
        if (optionDocs.length > 0) {
          const optionsCol = await getProductOptionsCollection()
          await optionsCol.insertMany(optionDocs)
        }
      } catch (variantError) {
        // Roll back the half-created product (and any options written).
        await products.deleteOne({ _id: productId })
        const optionsCol = await getProductOptionsCollection()
        await optionsCol.deleteMany({ product_id: productId })
        const variantsCol = await getProductVariantsCollection()
        await variantsCol.deleteMany({ product_id: productId })
        throw variantError
      }
    }

    revalidatePath('/products')
    revalidatePath('/dashboard')

    return { success: true, productId: productId.toString() }
  } catch (error) {
    console.error('Error in createProductAction:', error)
    if (error instanceof MongoServerError && error.code === 11000) {
      return { success: false, error: 'A product with this URL slug already exists.' }
    }
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

    const hasVariants =
      data.variants !== undefined
        ? data.variants.length > 0
        : (data.has_variants ?? false)

    const productSet: Record<string, unknown> = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      category_id: data.category_id ? toObjectId(data.category_id) : null,
      base_price: data.base_price ?? null,
      is_active: data.is_active,
      images: data.images || [],
      has_variants: hasVariants,
      updated_at: now,
    }
    // Variantless products need product-level stock to be purchasable.
    if (!hasVariants) {
      productSet.stock_quantity = data.stock_quantity ?? 0
    }

    await products.updateOne({ _id: productOid }, { $set: productSet })

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
        const variantData: Record<string, unknown> = {
          product_id: productOid,
          name: variant.name,
          sku: variant.sku || null,
          price: variant.price,
          compare_at_price: variant.compare_at_price ?? null,
          stock_quantity: variant.stock_quantity,
          image_url: variant.image_url || null,
          is_active: variant.is_active ?? true,
          updated_at: now,
        }
        // Only touch options when explicitly provided — NEVER reset to {}.
        if (variant.options !== undefined) {
          variantData.options = variant.options
        }

        if (variant.id) {
          await variantsCol.updateOne(
            { _id: toObjectId(variant.id) },
            { $set: variantData }
          )
        } else {
          await variantsCol.insertOne({
            _id: new ObjectId(),
            options: variant.options ?? {},
            ...variantData,
            created_at: now,
          } as ProductVariantDoc)
        }
      }

      // Upsert product_options to match the current variant options so the
      // storefront selector stays in sync. Rebuild from the current variant set.
      const optionsCol = await getProductOptionsCollection()
      await optionsCol.deleteMany({ product_id: productOid })
      const optionDocs = buildProductOptionDocs(productOid, data.variants)
      if (optionDocs.length > 0) {
        await optionsCol.insertMany(optionDocs)
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
 * Server action to permanently delete a product and its variants from the database
 */
export async function hardDeleteProductAction(id: string): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!id) return { success: false, error: 'Product ID is required' }

    const products = await getProductsCollection()
    const variants = await getProductVariantsCollection()

    await variants.deleteMany({ product_id: toObjectId(id) })
    await products.deleteOne({ _id: toObjectId(id) })

    revalidatePath('/products')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in hardDeleteProductAction:', error)
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
