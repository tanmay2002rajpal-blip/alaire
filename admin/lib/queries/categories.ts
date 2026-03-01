"use server"

import { ObjectId } from 'mongodb'
import { getCategoriesCollection, getProductsCollection, getActivityLogCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { logActivity } from './activity'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parent_id: string | null
  sort_order: number
  created_at: string
  product_count: number
}

export interface CategoryWithParent extends Category {
  parent_category: {
    id: string
    name: string
    slug: string
  } | null
}

export interface CreateCategoryData {
  name: string
  description?: string | null
  image?: string | null
  parent_id?: string | null
  sort_order?: number
}

export interface UpdateCategoryData {
  name?: string
  description?: string | null
  image?: string | null
  parent_id?: string | null
  sort_order?: number
}

/**
 * Generate a URL-friendly slug from a category name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
}

/**
 * Get all categories with product counts
 * Returns flat array with parent_id for hierarchy
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await getCategoriesCollection()
    const products = await getProductsCollection()

    const data = await categories.find().sort({ name: 1 }).toArray()

    // Get product counts per category
    const productCounts = await products.aggregate<{ _id: ObjectId; count: number }>([
      { $group: { _id: '$category_id', count: { $sum: 1 } } },
    ]).toArray()

    const countMap = new Map(productCounts.map(pc => [pc._id?.toString(), pc.count]))

    return data.map(category => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image_url,
      parent_id: category.parent_id?.toString() || null,
      sort_order: category.position,
      created_at: category.created_at.toISOString(),
      product_count: countMap.get(category._id.toString()) || 0,
    }))
  } catch (err) {
    console.error("Unexpected error fetching categories:", err)
    return []
  }
}

/**
 * Get a single category by ID with parent info and product count
 */
export async function getCategoryById(
  id: string
): Promise<CategoryWithParent | null> {
  const categories = await getCategoriesCollection()
  const products = await getProductsCollection()

  const oid = toObjectId(id)
  const data = await categories.findOne({ _id: oid })

  if (!data) return null

  // Get product count and parent in parallel
  const [productCount, parentCategory] = await Promise.all([
    products.countDocuments({ category_id: oid }),
    data.parent_id
      ? categories.findOne(
          { _id: data.parent_id },
          { projection: { name: 1, slug: 1 } }
        )
      : Promise.resolve(null),
  ])

  return {
    id: data._id.toString(),
    name: data.name,
    slug: data.slug,
    description: data.description,
    image: data.image_url,
    parent_id: data.parent_id?.toString() || null,
    sort_order: data.position,
    created_at: data.created_at.toISOString(),
    product_count: productCount,
    parent_category: parentCategory ? {
      id: parentCategory._id.toString(),
      name: parentCategory.name,
      slug: parentCategory.slug,
    } : null,
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  categoryData: CreateCategoryData
): Promise<Category> {
  const categories = await getCategoriesCollection()

  // Generate slug from name
  const slug = generateSlug(categoryData.name)

  // Check if slug already exists
  const existing = await categories.findOne({ slug })
  if (existing) {
    throw new Error("A category with this name already exists")
  }

  const now = new Date()
  const newId = new ObjectId()

  await categories.insertOne({
    _id: newId,
    name: categoryData.name,
    slug,
    description: categoryData.description || null,
    image_url: categoryData.image || null,
    parent_id: categoryData.parent_id ? toObjectId(categoryData.parent_id) : null,
    position: categoryData.sort_order || 0,
    is_active: true,
    created_at: now,
    updated_at: now,
  })

  // Log activity
  await logActivity({
    action: "create",
    entityType: "category",
    entityId: newId.toString(),
    details: {
      name: categoryData.name,
      slug,
    },
  })

  return {
    id: newId.toString(),
    name: categoryData.name,
    slug,
    description: categoryData.description || null,
    image: categoryData.image || null,
    parent_id: categoryData.parent_id || null,
    sort_order: categoryData.sort_order || 0,
    created_at: now.toISOString(),
    product_count: 0,
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(
  id: string,
  categoryData: UpdateCategoryData
): Promise<Category> {
  const categories = await getCategoriesCollection()
  const oid = toObjectId(id)

  const updateData: Record<string, any> = {}

  // Only include fields that are provided
  if (categoryData.name !== undefined) {
    updateData.name = categoryData.name
    updateData.slug = generateSlug(categoryData.name)

    // Check if new slug conflicts with another category
    const existing = await categories.findOne({
      slug: updateData.slug,
      _id: { $ne: oid },
    })
    if (existing) {
      throw new Error("A category with this name already exists")
    }
  }

  if (categoryData.description !== undefined) {
    updateData.description = categoryData.description
  }

  if (categoryData.image !== undefined) {
    updateData.image_url = categoryData.image
  }

  if (categoryData.parent_id !== undefined) {
    // Prevent circular references
    if (categoryData.parent_id === id) {
      throw new Error("A category cannot be its own parent")
    }

    if (categoryData.parent_id) {
      updateData.parent_id = toObjectId(categoryData.parent_id)

      // Check if parent_id would create a circular reference
      const parent = await getCategoryById(categoryData.parent_id)
      if (parent?.parent_id === id) {
        throw new Error("This would create a circular category hierarchy")
      }
    } else {
      updateData.parent_id = null
    }
  }

  if (categoryData.sort_order !== undefined) {
    updateData.position = categoryData.sort_order
  }

  updateData.updated_at = new Date()

  // Update the category
  await categories.updateOne({ _id: oid }, { $set: updateData })

  // Log activity
  await logActivity({
    action: "update",
    entityType: "category",
    entityId: id,
    details: {
      updated_fields: Object.keys(updateData),
      ...updateData,
    },
  })

  // Fetch the updated category to return
  const products = await getProductsCollection()
  const updated = await categories.findOne({ _id: oid })
  const productCount = await products.countDocuments({ category_id: oid })

  return {
    id: updated!._id.toString(),
    name: updated!.name,
    slug: updated!.slug,
    description: updated!.description,
    image: updated!.image_url,
    parent_id: updated!.parent_id?.toString() || null,
    sort_order: updated!.position,
    created_at: updated!.created_at.toISOString(),
    product_count: productCount,
  }
}

/**
 * Delete a category
 * Blocks deletion if category has products
 */
export async function deleteCategory(id: string): Promise<void> {
  const categories = await getCategoriesCollection()
  const products = await getProductsCollection()
  const oid = toObjectId(id)

  // Check if category exists and has products
  const [category, productCount, childCount] = await Promise.all([
    categories.findOne({ _id: oid }, { projection: { name: 1 } }),
    products.countDocuments({ category_id: oid }),
    categories.countDocuments({ parent_id: oid }),
  ])

  if (!category) {
    throw new Error("Category not found")
  }

  if (productCount > 0) {
    throw new Error(
      `Cannot delete category "${category.name}" because it has ${productCount} product(s). Please move or delete the products first.`
    )
  }

  if (childCount > 0) {
    throw new Error(
      `Cannot delete category "${category.name}" because it has ${childCount} subcategory(ies). Please move or delete the subcategories first.`
    )
  }

  await categories.deleteOne({ _id: oid })

  // Log activity
  await logActivity({
    action: "delete",
    entityType: "category",
    entityId: id,
    details: { name: category.name },
  })
}

/**
 * Reorder categories by updating sort_order
 */
export async function reorderCategories(
  orderedIds: string[]
): Promise<void> {
  const categories = await getCategoriesCollection()

  const updates = orderedIds.map((id, index) =>
    categories.updateOne(
      { _id: toObjectId(id) },
      { $set: { position: index } }
    )
  )

  await Promise.all(updates)

  // Log activity
  await logActivity({
    action: "reorder",
    entityType: "category",
    entityId: orderedIds.join(","),
    details: {
      category_count: orderedIds.length,
      new_order: orderedIds,
    },
  })
}
