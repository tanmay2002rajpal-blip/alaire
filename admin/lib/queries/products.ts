import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  // Build base query - products table uses base_price, stock is in variants
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      category_id,
      base_price,
      images,
      has_variants,
      is_active,
      created_at,
      categories (
        id,
        name,
        slug
      )
    `, { count: 'exact' });

  // Apply category filter
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('is_active', filters.status === 'active');
  }

  // Note: Stock level filtering requires joining with variants
  // For now, we'll filter after fetching if needed

  // Apply search filter (name, description, SKU)
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    // Search in product name and description
    query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
  }

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: productsData, error: productsError, count } = await query;

  if (productsError) {
    console.error('Error fetching products:', productsError);
    throw new Error('Failed to fetch products');
  }

  // Get variants data for each product (count, stock, min price)
  const productIds = productsData?.map(product => product.id) || [];

  let variantsData: { product_id: string; stock_quantity: number; price: number; is_active: boolean }[] = [];
  if (productIds.length > 0) {
    const { data, error: variantsError } = await supabase
      .from('product_variants')
      .select('product_id, stock_quantity, price, is_active')
      .in('product_id', productIds);

    if (variantsError) {
      console.error('Error fetching product variants:', variantsError);
    }
    variantsData = data || [];
  }

  // Aggregate variants per product
  const variantsMap = variantsData.reduce((acc, variant) => {
    if (!acc[variant.product_id]) {
      acc[variant.product_id] = { count: 0, totalStock: 0, minPrice: Infinity };
    }
    acc[variant.product_id].count += 1;
    if (variant.is_active) {
      acc[variant.product_id].totalStock += variant.stock_quantity || 0;
      if (variant.price < acc[variant.product_id].minPrice) {
        acc[variant.product_id].minPrice = variant.price;
      }
    }
    return acc;
  }, {} as Record<string, { count: number; totalStock: number; minPrice: number }>);

  // Transform data
  const products: Product[] = (productsData || []).map(product => {
    const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;
    const variantInfo = variantsMap[product.id] || { count: 0, totalStock: 0, minPrice: Infinity };

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category_id: product.category_id,
      base_price: product.base_price,
      images: product.images || [],
      has_variants: product.has_variants,
      is_active: product.is_active,
      created_at: product.created_at,
      category_name: category?.name || null,
      category_slug: category?.slug || null,
      variants_count: variantInfo.count,
      total_stock: variantInfo.totalStock,
      min_price: variantInfo.minPrice === Infinity ? product.base_price : variantInfo.minPrice,
    };
  });

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    products,
    total,
    page,
    totalPages,
  };
}

/**
 * Get single product with full details
 */
export async function getProductById(id: string): Promise<ProductDetail | null> {
  const supabase = await createClient();

  // Get product with category info
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      category_id,
      base_price,
      images,
      has_variants,
      is_active,
      created_at,
      categories (
        id,
        name,
        slug,
        parent_id,
        image_url
      )
    `)
    .eq('id', id)
    .single();

  if (productError || !productData) {
    console.error('Error fetching product:', productError);
    return null;
  }

  // Get product variants
  const { data: variantsData, error: variantsError } = await supabase
    .from('product_variants')
    .select(`
      id,
      product_id,
      name,
      sku,
      price,
      compare_at_price,
      stock_quantity,
      options,
      image_url,
      is_active
    `)
    .eq('product_id', id)
    .order('name', { ascending: true });

  if (variantsError) {
    console.error('Error fetching product variants:', variantsError);
  }

  // Transform category
  const category = productData.categories
    ? (Array.isArray(productData.categories) ? productData.categories[0] : productData.categories)
    : null;

  // Calculate total stock from variants
  const totalStock = (variantsData || [])
    .filter(v => v.is_active)
    .reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

  return {
    id: productData.id,
    name: productData.name,
    slug: productData.slug,
    description: productData.description,
    category_id: productData.category_id,
    base_price: productData.base_price,
    images: productData.images || [],
    has_variants: productData.has_variants,
    is_active: productData.is_active,
    created_at: productData.created_at,
    category: category ? {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id,
      image: category.image_url,
    } : null,
    variants: (variantsData || []).map(variant => ({
      id: variant.id,
      product_id: variant.product_id,
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      compare_at_price: variant.compare_at_price,
      stock_quantity: variant.stock_quantity,
      options: variant.options,
      image_url: variant.image_url,
      is_active: variant.is_active,
    })),
    total_stock: totalStock,
  };
}

/**
 * Create a new product
 */
export async function createProduct(
  data: CreateProductData,
  adminId?: string
): Promise<{ success: boolean; productId?: string; error?: string }> {
  const supabase = await createClient();

  try {
    // Insert product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        category_id: data.category_id || null,
        base_price: data.base_price || null,
        images: data.images || [],
        has_variants: data.has_variants || false,
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
      .select('id')
      .single();

    if (productError || !productData) {
      console.error('Error creating product:', productError);
      return { success: false, error: 'Failed to create product' };
    }

    const productId = productData.id;

    // Create variants if provided
    if (data.variants && data.variants.length > 0) {
      const variantsToInsert = data.variants.map(variant => ({
        product_id: productId,
        name: variant.name,
        sku: variant.sku || null,
        price: variant.price,
        compare_at_price: variant.compare_at_price || null,
        stock_quantity: variant.stock_quantity,
        options: variant.options || null,
        image_url: variant.image_url || null,
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

      if (variantsError) {
        console.error('Error creating product variants:', variantsError);
        // Continue anyway, product is created
      }
    }

    // Log activity
    if (adminId) {
      await supabase
        .from('activity_log')
        .insert({
          admin_id: adminId,
          action: 'create',
          entity_type: 'product',
          entity_id: productId,
          details: {
            product_name: data.name,
          },
        });
    }

    return { success: true, productId };
  } catch (error) {
    console.error('Unexpected error creating product:', error);
    return { success: false, error: 'An unexpected error occurred' };
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
  const supabase = await createClient();

  try {
    // Build update object (only include fields that are provided)
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category_id !== undefined) updateData.category_id = data.category_id;
    if (data.base_price !== undefined) updateData.base_price = data.base_price;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.has_variants !== undefined) updateData.has_variants = data.has_variants;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    // Update product if there are fields to update
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating product:', updateError);
        return { success: false, error: 'Failed to update product' };
      }
    }

    // Handle variants
    if (data.variants) {
      // Add new variants
      if (data.variants.add && data.variants.add.length > 0) {
        const variantsToInsert = data.variants.add.map(variant => ({
          product_id: id,
          name: variant.name,
          sku: variant.sku || null,
          price: variant.price,
          compare_at_price: variant.compare_at_price || null,
          stock_quantity: variant.stock_quantity,
          options: variant.options || null,
          image_url: variant.image_url || null,
        }));

        const { error: addError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (addError) {
          console.error('Error adding product variants:', addError);
        }
      }

      // Update existing variants
      if (data.variants.update && data.variants.update.length > 0) {
        for (const variant of data.variants.update) {
          const variantUpdate: any = {};
          if (variant.name !== undefined) variantUpdate.name = variant.name;
          if (variant.sku !== undefined) variantUpdate.sku = variant.sku;
          if (variant.price !== undefined) variantUpdate.price = variant.price;
          if (variant.compare_at_price !== undefined) variantUpdate.compare_at_price = variant.compare_at_price;
          if (variant.stock_quantity !== undefined) variantUpdate.stock_quantity = variant.stock_quantity;
          if (variant.options !== undefined) variantUpdate.options = variant.options;
          if (variant.image_url !== undefined) variantUpdate.image_url = variant.image_url;
          if (variant.is_active !== undefined) variantUpdate.is_active = variant.is_active;

          if (Object.keys(variantUpdate).length > 0) {
            variantUpdate.updated_at = new Date().toISOString();
            const { error: updateError } = await supabase
              .from('product_variants')
              .update(variantUpdate)
              .eq('id', variant.id)
              .eq('product_id', id);

            if (updateError) {
              console.error(`Error updating variant ${variant.id}:`, updateError);
            }
          }
        }
      }

      // Delete variants
      if (data.variants.delete && data.variants.delete.length > 0) {
        const { error: deleteError } = await supabase
          .from('product_variants')
          .delete()
          .in('id', data.variants.delete)
          .eq('product_id', id);

        if (deleteError) {
          console.error('Error deleting product variants:', deleteError);
        }
      }
    }

    // Log activity
    if (adminId) {
      await supabase
        .from('activity_log')
        .insert({
          admin_id: adminId,
          action: 'update',
          entity_type: 'product',
          entity_id: id,
          details: updateData,
        });
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating product:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(
  id: string,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting product:', deleteError);
      return { success: false, error: 'Failed to delete product' };
    }

    // Log activity
    if (adminId) {
      await supabase
        .from('activity_log')
        .insert({
          admin_id: adminId,
          action: 'delete',
          entity_type: 'product',
          entity_id: id,
          details: {
            soft_delete: true,
          },
        });
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting product:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get product statistics
 */
export async function getProductStats(): Promise<ProductStats> {
  const supabase = await createClient();

  // Get total products count
  const { count: totalProducts, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error fetching total products count:', countError);
  }

  // Get active products count
  const { count: activeProducts, error: activeError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (activeError) {
    console.error('Error fetching active products count:', activeError);
  }

  // Get inactive products count
  const { count: inactiveProducts, error: inactiveError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', false);

  if (inactiveError) {
    console.error('Error fetching inactive products count:', inactiveError);
  }

  // Get low stock count from product_variants (stock > 0 and stock < 10)
  const { count: lowStockCount, error: lowStockError } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .gt('stock_quantity', 0)
    .lt('stock_quantity', 10)
    .eq('is_active', true);

  if (lowStockError) {
    console.error('Error fetching low stock count:', lowStockError);
  }

  // Get out of stock count from product_variants
  const { count: outOfStockCount, error: outOfStockError } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('stock_quantity', 0)
    .eq('is_active', true);

  if (outOfStockError) {
    console.error('Error fetching out of stock count:', outOfStockError);
  }

  // Calculate total inventory value (price * stock for all active variants)
  const { data: inventoryData, error: inventoryError } = await supabase
    .from('product_variants')
    .select('price, stock_quantity')
    .eq('is_active', true);

  if (inventoryError) {
    console.error('Error fetching inventory data:', inventoryError);
  }

  const totalInventoryValue = (inventoryData || []).reduce((sum, variant) => {
    const price = variant.price || 0;
    const stock = variant.stock_quantity || 0;
    return sum + (price * stock);
  }, 0);

  return {
    total_products: totalProducts || 0,
    active_products: activeProducts || 0,
    inactive_products: inactiveProducts || 0,
    low_stock_count: lowStockCount || 0,
    out_of_stock_count: outOfStockCount || 0,
    total_inventory_value: totalInventoryValue,
  };
}

/**
 * Get all categories (helper function)
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, image_url')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }

  return (categories || []).map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parent_id: cat.parent_id,
    image: cat.image_url,
  }));
}
