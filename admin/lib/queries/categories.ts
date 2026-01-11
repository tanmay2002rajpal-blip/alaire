"use server"

import { createClient } from "@/lib/supabase/server"
import { logActivity } from "./activity"

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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        description,
        image_url,
        parent_id,
        position,
        created_at,
        products:products(count)
      `
      )
      .order("name")

    if (error) {
      console.error("Error fetching categories:", JSON.stringify(error, null, 2))
      // Return empty array instead of throwing to allow page to render
      return []
    }

    // Transform the data to include product_count
    return (data || []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image_url,
      parent_id: category.parent_id,
      sort_order: category.position,
      created_at: category.created_at,
      product_count: category.products?.[0]?.count || 0,
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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      slug,
      description,
      image_url,
      parent_id,
      position,
      created_at,
      products:products(count),
      parent_category:parent_id(id, name, slug)
    `
    )
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // Category not found
    }
    console.error("Error fetching category:", error)
    throw new Error("Failed to fetch category")
  }

  // Handle parent_category which may be returned as array by Supabase
  const parentCategory = data.parent_category
    ? (Array.isArray(data.parent_category) ? data.parent_category[0] : data.parent_category)
    : null

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    image: data.image_url,
    parent_id: data.parent_id,
    sort_order: data.position,
    created_at: data.created_at,
    product_count: data.products?.[0]?.count || 0,
    parent_category: parentCategory ? {
      id: parentCategory.id,
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
  const supabase = await createClient()

  // Generate slug from name
  const slug = generateSlug(categoryData.name)

  // Check if slug already exists
  const { data: existingCategory } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .single()

  if (existingCategory) {
    throw new Error("A category with this name already exists")
  }

  // Insert the category
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: categoryData.name,
      slug,
      description: categoryData.description || null,
      image_url: categoryData.image || null,
      parent_id: categoryData.parent_id || null,
      position: categoryData.sort_order || 0,
    })
    .select(
      `
      id,
      name,
      slug,
      description,
      image_url,
      parent_id,
      position,
      created_at
    `
    )
    .single()

  if (error) {
    console.error("Error creating category:", error)
    throw new Error("Failed to create category")
  }

  // Log activity
  await logActivity({
    action: "create",
    entityType: "category",
    entityId: data.id,
    details: {
      name: data.name,
      slug: data.slug,
    },
  })

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    image: data.image_url,
    parent_id: data.parent_id,
    sort_order: data.position,
    created_at: data.created_at,
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
  const supabase = await createClient()

  const updateData: Record<string, any> = {}

  // Only include fields that are provided
  if (categoryData.name !== undefined) {
    updateData.name = categoryData.name
    updateData.slug = generateSlug(categoryData.name)

    // Check if new slug conflicts with another category
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", updateData.slug)
      .neq("id", id)
      .single()

    if (existingCategory) {
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
    updateData.parent_id = categoryData.parent_id

    // Prevent circular references
    if (categoryData.parent_id === id) {
      throw new Error("A category cannot be its own parent")
    }

    // Check if parent_id would create a circular reference
    if (categoryData.parent_id) {
      const parent = await getCategoryById(categoryData.parent_id)
      if (parent?.parent_id === id) {
        throw new Error("This would create a circular category hierarchy")
      }
    }
  }

  if (categoryData.sort_order !== undefined) {
    updateData.position = categoryData.sort_order
  }

  // Update the category
  const { data, error } = await supabase
    .from("categories")
    .update(updateData)
    .eq("id", id)
    .select(
      `
      id,
      name,
      slug,
      description,
      image_url,
      parent_id,
      position,
      created_at,
      products:products(count)
    `
    )
    .single()

  if (error) {
    console.error("Error updating category:", error)
    throw new Error("Failed to update category")
  }

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

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    image: data.image_url,
    parent_id: data.parent_id,
    sort_order: data.position,
    created_at: data.created_at,
    product_count: data.products?.[0]?.count || 0,
  }
}

/**
 * Delete a category
 * Blocks deletion if category has products
 */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient()

  // Check if category has products
  const { data: category } = await supabase
    .from("categories")
    .select(
      `
      name,
      products:products(count)
    `
    )
    .eq("id", id)
    .single()

  if (!category) {
    throw new Error("Category not found")
  }

  const productCount = category.products?.[0]?.count || 0
  if (productCount > 0) {
    throw new Error(
      `Cannot delete category "${category.name}" because it has ${productCount} product(s). Please move or delete the products first.`
    )
  }

  // Check if category has child categories
  const { data: childCategories } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", id)

  if (childCategories && childCategories.length > 0) {
    throw new Error(
      `Cannot delete category "${category.name}" because it has ${childCategories.length} subcategory(ies). Please move or delete the subcategories first.`
    )
  }

  // Delete the category
  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    console.error("Error deleting category:", error)
    throw new Error("Failed to delete category")
  }

  // Log activity
  await logActivity({
    action: "delete",
    entityType: "category",
    entityId: id,
    details: {
      name: category.name,
    },
  })
}

/**
 * Reorder categories by updating sort_order
 */
export async function reorderCategories(
  orderedIds: string[]
): Promise<void> {
  const supabase = await createClient()

  // Update position for each category
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("categories")
      .update({ position: index })
      .eq("id", id)
  )

  const results = await Promise.all(updates)

  // Check if any updates failed
  const errors = results.filter((result) => result.error)
  if (errors.length > 0) {
    console.error("Error reordering categories:", errors)
    throw new Error("Failed to reorder categories")
  }

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
