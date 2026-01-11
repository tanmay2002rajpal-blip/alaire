'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();

    // Extract form data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const parentId = formData.get('parent_id') as string | null;
    const image = formData.get('image') as string | null;

    // Validate required fields
    if (!name || name.trim() === '') {
      return {
        success: false,
        error: 'Category name is required',
      };
    }

    // Generate slug
    const slug = generateSlug(name);

    // Validate slug uniqueness
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      return {
        success: false,
        error: 'A category with this name already exists',
      };
    }

    // Insert new category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        parent_id: parentId || null,
        image_url: image || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return {
        success: false,
        error: 'Failed to create category',
      };
    }

    // Revalidate categories routes
    revalidatePath('/admin/categories');
    revalidatePath('/categories');

    return {
      success: true,
      categoryId: data.id,
    };
  } catch (error) {
    console.error('Unexpected error creating category:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Updates an existing category
 */
export async function updateCategoryAction(id: string, formData: FormData) {
  try {
    const supabase = await createClient();

    // Extract form data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const parentId = formData.get('parent_id') as string | null;
    const image = formData.get('image') as string | null;

    // Validate required fields
    if (!name || name.trim() === '') {
      return {
        success: false,
        error: 'Category name is required',
      };
    }

    // Get current category to check if name changed
    const { data: currentCategory, error: fetchError } = await supabase
      .from('categories')
      .select('name, slug')
      .eq('id', id)
      .single();

    if (fetchError || !currentCategory) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    // Generate new slug if name changed
    let slug = currentCategory.slug;
    if (name.trim() !== currentCategory.name) {
      slug = generateSlug(name);

      // Validate slug uniqueness
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existingCategory) {
        return {
          success: false,
          error: 'A category with this name already exists',
        };
      }
    }

    // Validate no circular parent reference
    if (parentId) {
      // Check if the parent_id is the category itself
      if (parentId === id) {
        return {
          success: false,
          error: 'A category cannot be its own parent',
        };
      }

      // Check if the parent_id is a descendant of this category
      let currentParentId = parentId;
      const checkedIds = new Set([id]);

      while (currentParentId) {
        if (checkedIds.has(currentParentId)) {
          return {
            success: false,
            error: 'Circular parent reference detected',
          };
        }

        checkedIds.add(currentParentId);

        const { data: parentCategory } = await supabase
          .from('categories')
          .select('parent_id')
          .eq('id', currentParentId)
          .single();

        if (!parentCategory) {
          break;
        }

        currentParentId = parentCategory.parent_id;
      }
    }

    // Update category
    const { error: updateError } = await supabase
      .from('categories')
      .update({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        parent_id: parentId || null,
        image_url: image || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating category:', updateError);
      return {
        success: false,
        error: 'Failed to update category',
      };
    }

    // Revalidate categories routes
    revalidatePath('/admin/categories');
    revalidatePath('/categories');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error updating category:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Deletes a category
 */
export async function deleteCategoryAction(id: string) {
  try {
    const supabase = await createClient();

    // Check if category has products
    const { count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (productsError) {
      console.error('Error checking products:', productsError);
      return {
        success: false,
        error: 'Failed to check category dependencies',
      };
    }

    if (productsCount && productsCount > 0) {
      return {
        success: false,
        error: 'Cannot delete category with associated products',
      };
    }

    // Check if category has subcategories
    const { count: subcategoriesCount, error: subcategoriesError } =
      await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', id);

    if (subcategoriesError) {
      console.error('Error checking subcategories:', subcategoriesError);
      return {
        success: false,
        error: 'Failed to check category dependencies',
      };
    }

    if (subcategoriesCount && subcategoriesCount > 0) {
      return {
        success: false,
        error: 'Cannot delete category with subcategories',
      };
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      return {
        success: false,
        error: 'Failed to delete category',
      };
    }

    // Revalidate categories routes
    revalidatePath('/admin/categories');
    revalidatePath('/categories');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error deleting category:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Updates the sort order of categories
 */
export async function reorderCategoriesAction(orderedIds: string[]) {
  try {
    const supabase = await createClient();

    // Update sort_order for each category
    const updates = orderedIds.map((id, index) =>
      supabase
        .from('categories')
        .update({ sort_order: index })
        .eq('id', id)
    );

    const results = await Promise.all(updates);

    // Check if any updates failed
    const failedUpdate = results.find((result) => result.error);
    if (failedUpdate) {
      console.error('Error reordering categories:', failedUpdate.error);
      return {
        success: false,
        error: 'Failed to reorder categories',
      };
    }

    // Revalidate categories routes
    revalidatePath('/admin/categories');
    revalidatePath('/categories');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error reordering categories:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
