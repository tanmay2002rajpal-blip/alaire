import { ObjectId } from 'mongodb'
import { getProductsCollection, getProductVariantsCollection, getCategoriesCollection, getActivityLogCollection } from '@/lib/db/collections'
import { toObjectId, paginate, totalPages } from '@/lib/db/helpers'

// Types
export interface ProductFilters {
  category_id?: string;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  stock_level?: 'low' | 'out' | 'all';
  page?: number;
  limit?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  base_price: number | null;
  images: string[];
  has_variants: boolean;
  is_active: boolean;
  created_at: string;
  category_name: string | null;
  category_slug: string | null;
  variants_count: number;
  total_stock: number;
  min_price: number | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  options: any;
  image_url: string | null;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image: string | null;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  base_price: number | null;
  images: string[];
  has_variants: boolean;
  is_active: boolean;
  created_at: string;
  category: Category | null;
  variants: ProductVariant[];
  total_stock: number;
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_inventory_value: number;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  base_price?: number;
  images?: string[];
  has_variants?: boolean;
  is_active?: boolean;
  variants?: Array<{
    name: string;
    sku?: string;
    price: number;
    compare_at_price?: number;
    stock_quantity: number;
    options?: any;
    image_url?: string;
  }>;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  category_id?: string;
  base_price?: number;
  images?: string[];
  has_variants?: boolean;
  is_active?: boolean;
  variants?: {
    add?: Array<{
      name: string;
      sku?: string;
      price: number;
      compare_at_price?: number;
      stock_quantity: number;
      options?: any;
      image_url?: string;
    }>;
    update?: Array<{
      id: string;
      name?: string;
      sku?: string;
      price?: number;
      compare_at_price?: number;
      stock_quantity?: number;
      options?: any;
      image_url?: string;
      is_active?: boolean;
    }>;
    delete?: string[];
  };
}

/**
 * Get paginated products with filters
 */
export async function getProducts(filters?: ProductFilters): Promise<PaginatedProducts> {
  const products = await getProductsCollection()
  const variants = await getProductVariantsCollection()

  const { skip, limit: lim, page } = paginate(filters?.page, filters?.limit || 20)

  // Build filter
  const filter: Record<string, any> = {}

  if (filters?.category_id) {
    filter.category_id = toObjectId(filters.category_id)
  }

  if (filters?.status && filters.status !== 'all') {
    filter.is_active = filters.status === 'active'
  }

  if (filters?.search) {
    filter.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
    ]
  }

  // Get products with count
  const [productsData, total] = await Promise.all([
    products.find(filter).sort({ created_at: -1 }).skip(skip).limit(lim).toArray(),
    products.countDocuments(filter),
  ])

  // Get category info and variants for returned products
  const productIds = productsData.map(p => p._id)

  const [categoriesData, variantsData] = await Promise.all([
    // Get all unique category IDs and fetch them
    (async () => {
      const categoryIds = [...new Set(productsData.map(p => p.category_id).filter(Boolean))] as ObjectId[]
      if (categoryIds.length === 0) return []
      const cats = await getCategoriesCollection()
      return cats.find({ _id: { $in: categoryIds } }, { projection: { name: 1, slug: 1 } }).toArray()
    })(),
    productIds.length > 0
      ? variants.find(
          { product_id: { $in: productIds } },
          { projection: { product_id: 1, stock_quantity: 1, price: 1, is_active: 1 } }
        ).toArray()
      : Promise.resolve([]),
  ])

  // Build lookups
  const categoryMap = new Map(categoriesData.map(c => [c._id.toString(), c]))

  const variantsMap: Record<string, { count: number; totalStock: number; minPrice: number }> = {}
  for (const v of variantsData) {
    const pid = v.product_id.toString()
    if (!variantsMap[pid]) {
      variantsMap[pid] = { count: 0, totalStock: 0, minPrice: Infinity }
    }
    variantsMap[pid].count += 1
    if (v.is_active) {
      variantsMap[pid].totalStock += v.stock_quantity || 0
      if (v.price < variantsMap[pid].minPrice) {
        variantsMap[pid].minPrice = v.price
      }
    }
  }

  // Transform data
  const result: Product[] = productsData.map(product => {
    const cat = product.category_id ? categoryMap.get(product.category_id.toString()) : null
    const vi = variantsMap[product._id.toString()] || { count: 0, totalStock: 0, minPrice: Infinity }

    return {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      category_id: product.category_id?.toString() || null,
      base_price: product.base_price,
      images: product.images || [],
      has_variants: product.has_variants,
      is_active: product.is_active,
      created_at: product.created_at.toISOString(),
      category_name: cat?.name || null,
      category_slug: cat?.slug || null,
      variants_count: vi.count,
      total_stock: vi.totalStock,
      min_price: vi.minPrice === Infinity ? product.base_price : vi.minPrice,
    }
  })

  return {
    products: result,
    total,
    page,
    totalPages: totalPages(total, lim),
  }
}

/**
 * Get single product with full details
 */
export async function getProductById(id: string): Promise<ProductDetail | null> {
  const products = await getProductsCollection()
  const variantsCol = await getProductVariantsCollection()

  const productData = await products.findOne({ _id: toObjectId(id) })
  if (!productData) return null

  // Get category and variants in parallel
  const [categoryData, variantsData] = await Promise.all([
    productData.category_id
      ? (async () => {
          const cats = await getCategoriesCollection()
          return cats.findOne(
            { _id: productData.category_id! },
            { projection: { name: 1, slug: 1, parent_id: 1, image_url: 1 } }
          )
        })()
      : Promise.resolve(null),
    variantsCol.find({ product_id: productData._id }).sort({ name: 1 }).toArray(),
  ])

  const totalStock = variantsData
    .filter(v => v.is_active)
    .reduce((sum, v) => sum + (v.stock_quantity || 0), 0)

  return {
    id: productData._id.toString(),
    name: productData.name,
    slug: productData.slug,
    description: productData.description,
    category_id: productData.category_id?.toString() || null,
    base_price: productData.base_price,
    images: productData.images || [],
    has_variants: productData.has_variants,
    is_active: productData.is_active,
    created_at: productData.created_at.toISOString(),
    category: categoryData ? {
      id: categoryData._id.toString(),
      name: categoryData.name,
      slug: categoryData.slug,
      parent_id: categoryData.parent_id?.toString() || null,
      image: categoryData.image_url,
    } : null,
    variants: variantsData.map(v => ({
      id: v._id.toString(),
      product_id: v.product_id.toString(),
      name: v.name,
      sku: v.sku,
      price: v.price,
      compare_at_price: v.compare_at_price,
      stock_quantity: v.stock_quantity,
      options: v.options,
      image_url: v.image_url,
      is_active: v.is_active,
    })),
    total_stock: totalStock,
  }
}

/**
 * Create a new product
 */
export async function createProduct(
  data: CreateProductData,
  adminId?: string
): Promise<{ success: boolean; productId?: string; error?: string }> {
  const products = await getProductsCollection()

  try {
    const now = new Date()
    const productId = new ObjectId()

    await products.insertOne({
      _id: productId,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      category_id: data.category_id ? toObjectId(data.category_id) : null,
      base_price: data.base_price ?? null,
      images: data.images || [],
      has_variants: data.has_variants || false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: now,
      updated_at: now,
    })

    // Create variants if provided
    if (data.variants && data.variants.length > 0) {
      const variantsCol = await getProductVariantsCollection()
      const variantDocs = data.variants.map(v => ({
        _id: new ObjectId(),
        product_id: productId,
        name: v.name,
        sku: v.sku || null,
        price: v.price,
        compare_at_price: v.compare_at_price ?? null,
        stock_quantity: v.stock_quantity,
        options: v.options || null,
        image_url: v.image_url || null,
        is_active: true,
        created_at: now,
        updated_at: now,
      }))
      await variantsCol.insertMany(variantDocs)
    }

    // Log activity
    if (adminId) {
      const activityLog = await getActivityLogCollection()
      await activityLog.insertOne({
        _id: new ObjectId(),
        admin_id: toObjectId(adminId),
        admin_name: null,
        action: 'create',
        entity_type: 'product',
        entity_id: productId.toString(),
        details: { product_name: data.name },
        created_at: now,
      })
    }

    return { success: true, productId: productId.toString() }
  } catch (error) {
    console.error('Unexpected error creating product:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  data: UpdateProductData,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  const products = await getProductsCollection()
  const productOid = toObjectId(id)

  try {
    // Build update object
    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = data.description
    if (data.category_id !== undefined) updateData.category_id = data.category_id ? toObjectId(data.category_id) : null
    if (data.base_price !== undefined) updateData.base_price = data.base_price
    if (data.images !== undefined) updateData.images = data.images
    if (data.has_variants !== undefined) updateData.has_variants = data.has_variants
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    // Update product if there are fields to update
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date()
      await products.updateOne({ _id: productOid }, { $set: updateData })
    }

    // Handle variants
    if (data.variants) {
      const variantsCol = await getProductVariantsCollection()
      const now = new Date()

      // Add new variants
      if (data.variants.add && data.variants.add.length > 0) {
        const variantDocs = data.variants.add.map(v => ({
          _id: new ObjectId(),
          product_id: productOid,
          name: v.name,
          sku: v.sku || null,
          price: v.price,
          compare_at_price: v.compare_at_price ?? null,
          stock_quantity: v.stock_quantity,
          options: v.options || null,
          image_url: v.image_url || null,
          is_active: true,
          created_at: now,
          updated_at: now,
        }))
        await variantsCol.insertMany(variantDocs)
      }

      // Update existing variants
      if (data.variants.update && data.variants.update.length > 0) {
        for (const variant of data.variants.update) {
          const variantUpdate: Record<string, any> = {}
          if (variant.name !== undefined) variantUpdate.name = variant.name
          if (variant.sku !== undefined) variantUpdate.sku = variant.sku
          if (variant.price !== undefined) variantUpdate.price = variant.price
          if (variant.compare_at_price !== undefined) variantUpdate.compare_at_price = variant.compare_at_price
          if (variant.stock_quantity !== undefined) variantUpdate.stock_quantity = variant.stock_quantity
          if (variant.options !== undefined) variantUpdate.options = variant.options
          if (variant.image_url !== undefined) variantUpdate.image_url = variant.image_url
          if (variant.is_active !== undefined) variantUpdate.is_active = variant.is_active

          if (Object.keys(variantUpdate).length > 0) {
            variantUpdate.updated_at = now
            await variantsCol.updateOne(
              { _id: toObjectId(variant.id), product_id: productOid },
              { $set: variantUpdate }
            )
          }
        }
      }

      // Delete variants
      if (data.variants.delete && data.variants.delete.length > 0) {
        await variantsCol.deleteMany({
          _id: { $in: data.variants.delete.map(toObjectId) },
          product_id: productOid,
        })
      }
    }

    // Log activity
    if (adminId) {
      const activityLog = await getActivityLogCollection()
      await activityLog.insertOne({
        _id: new ObjectId(),
        admin_id: toObjectId(adminId),
        admin_name: null,
        action: 'update',
        entity_type: 'product',
        entity_id: id,
        details: updateData,
        created_at: new Date(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating product:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(
  id: string,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  const products = await getProductsCollection()

  try {
    await products.updateOne(
      { _id: toObjectId(id) },
      { $set: { is_active: false } }
    )

    // Log activity
    if (adminId) {
      const activityLog = await getActivityLogCollection()
      await activityLog.insertOne({
        _id: new ObjectId(),
        admin_id: toObjectId(adminId),
        admin_name: null,
        action: 'delete',
        entity_type: 'product',
        entity_id: id,
        details: { soft_delete: true },
        created_at: new Date(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting product:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get product statistics
 */
export async function getProductStats(): Promise<ProductStats> {
  const products = await getProductsCollection()
  const variantsCol = await getProductVariantsCollection()

  const [totalProducts, activeProducts, inactiveProducts, lowStockCount, outOfStockCount, inventoryData] = await Promise.all([
    products.countDocuments(),
    products.countDocuments({ is_active: true }),
    products.countDocuments({ is_active: false }),
    variantsCol.countDocuments({ is_active: true, stock_quantity: { $gt: 0, $lt: 10 } }),
    variantsCol.countDocuments({ is_active: true, stock_quantity: 0 }),
    variantsCol.aggregate<{ _id: null; total: number }>([
      { $match: { is_active: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$stock_quantity'] } } } },
    ]).toArray(),
  ])

  return {
    total_products: totalProducts,
    active_products: activeProducts,
    inactive_products: inactiveProducts,
    low_stock_count: lowStockCount,
    out_of_stock_count: outOfStockCount,
    total_inventory_value: inventoryData[0]?.total || 0,
  }
}

/**
 * Get all categories (helper function)
 */
export async function getCategories(): Promise<Category[]> {
  const categories = await getCategoriesCollection()

  const data = await categories
    .find({}, { projection: { name: 1, slug: 1, parent_id: 1, image_url: 1 } })
    .sort({ name: 1 })
    .toArray()

  return data.map(cat => ({
    id: cat._id.toString(),
    name: cat.name,
    slug: cat.slug,
    parent_id: cat.parent_id?.toString() || null,
    image: cat.image_url,
  }))
}
