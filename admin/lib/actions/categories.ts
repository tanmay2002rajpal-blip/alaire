'use server';

import { ObjectId } from 'mongodb'
import { getCategoriesCollection, getProductsCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache';

/**
 * Generates a URL-friendly slug from a category name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Creates a new category
 */
export async function createCategoryAction(formData: FormData) {
  try {
    const categories = await getCategoriesCollection()

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const parentId = formData.get('parent_id') as string | null;
    const image = formData.get('image') as string | null;

    if (!name || name.trim() === '') {
      return { success: false, error: 'Category name is required' };
    }

    const slug = generateSlug(name);

    // Validate slug uniqueness
    const existing = await categories.findOne({ slug })
    if (existing) {
      return { success: false, error: 'A category with this name already exists' };
    }

    const now = new Date()
    const newId = new ObjectId()

    await categories.insertOne({
      _id: newId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      parent_id: parentId ? toObjectId(parentId) : null,
      image_url: image || null,
      position: 0,
      created_at: now,
      updated_at: now,
    })

    revalidatePath('/admin/categories');
    revalidatePath('/categories');

    return { success: true, categoryId: newId.toString() };
  } catch (error) {
    console.error('Unexpected error creating category:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Updates an existing category
 */
export async function updateCategoryAction(id: string, formData: FormData) {
  try {
    const categories = await getCategoriesCollection()
    const oid = toObjectId(id)

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const parentId = formData.get('parent_id') as string | null;
    const image = formData.get('image') as string | null;

    if (!name || name.trim() === '') {
      return { success: false, error: 'Category name is required' };
    }

    // Get current category
    const currentCategory = await categories.findOne({ _id: oid })
    if (!currentCategory) {
      return { success: false, error: 'Category not found' };
    }

    // Generate new slug if name changed
    let slug = currentCategory.slug;
    if (name.trim() !== currentCategory.name) {
      slug = generateSlug(name);

      const existing = await categories.findOne({
        slug,
        _id: { $ne: oid },
      })
      if (existing) {
        return { success: false, error: 'A category with this name already exists' };
      }
    }

    // Validate no circular parent reference
    if (parentId) {
      if (parentId === id) {
        return { success: false, error: 'A category cannot be its own parent' };
      }

      let currentParentId: string | null = parentId;
      const checkedIds = new Set([id]);

      while (currentParentId) {
        if (checkedIds.has(currentParentId)) {
          return { success: false, error: 'Circular parent reference detected' };
        }

        checkedIds.add(currentParentId);

        const parentCategory = await categories.findOne(
          { _id: toObjectId(currentParentId) },
          { projection: { parent_id: 1 } }
        ) as { parent_id?: { toString(): string } | null } | null
        if (!parentCategory) break;

        currentParentId = parentCategory.parent_id?.toString() || null;
      }
    }

    await categories.updateOne(
      { _id: oid },
      {
        $set: {
          name: name.trim(),
          slug,
          description: description?.trim() || null,
          parent_id: parentId ? toObjectId(parentId) : null,
          image_url: image || null,
          updated_at: new Date(),
        },
      }
    )

    revalidatePath('/admin/categories');
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating category:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Deletes a category
 */
export async function deleteCategoryAction(id: string) {
  try {
    const categories = await getCategoriesCollection()
    const products = await getProductsCollection()
    const oid = toObjectId(id)

    // Check if category has products
    const productsCount = await products.countDocuments({ category_id: oid })
    if (productsCount > 0) {
      return { success: false, error: 'Cannot delete category with associated products' };
    }

    // Check if category has subcategories
    const subcategoriesCount = await categories.countDocuments({ parent_id: oid })
    if (subcategoriesCount > 0) {
      return { success: false, error: 'Cannot delete category with subcategories' };
    }

    await categories.deleteOne({ _id: oid })

    revalidatePath('/admin/categories');
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting category:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Updates the sort order of categories
 */
export async function reorderCategoriesAction(orderedIds: string[]) {
  try {
    const categories = await getCategoriesCollection()

    const updates = orderedIds.map((id, index) =>
      categories.updateOne(
        { _id: toObjectId(id) },
        { $set: { position: index } }
      )
    )

    await Promise.all(updates)

    revalidatePath('/admin/categories');
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error reordering categories:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
