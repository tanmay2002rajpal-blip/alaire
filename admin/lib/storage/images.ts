import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Result type for upload operations
 */
export type UploadResult = {
  success: boolean
  url?: string
  error?: string
}

/**
 * Storage bucket names
 * Note: These buckets must be created in Supabase Dashboard with public access
 */
export const BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  CATEGORY_IMAGES: 'category-images',
  HERO_IMAGES: 'hero-images',
} as const

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Allowed image MIME types
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

/**
 * Validates that a file is an image and under the size limit
 * @param file - The file to validate
 * @returns Error message if invalid, null if valid
 */
export function validateImage(file: File): string | null {
  if (!file) {
    return 'No file provided'
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
  }

  return null
}

/**
 * Generates a unique filename with timestamp
 * @param originalName - The original filename
 * @returns A unique filename with timestamp prefix
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${timestamp}_${sanitized}`
}

/**
 * Gets the public URL for an image in storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns The public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createAdminClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Deletes an image from storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns UploadResult indicating success or failure
 */
export async function deleteImage(
  bucket: string,
  path: string
): Promise<UploadResult> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error('Error deleting image:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete image',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error deleting image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Uploads a product image to Supabase Storage
 * @param file - The image file to upload
 * @param productId - The product ID
 * @returns UploadResult with public URL if successful
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<UploadResult> {
  try {
    // Validate the image
    const validationError = validateImage(file)
    if (validationError) {
      return {
        success: false,
        error: validationError,
      }
    }

    const supabase = createAdminClient()
    const fileName = generateFileName(file.name)
    const filePath = `products/${productId}/${fileName}`

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(BUCKETS.PRODUCT_IMAGES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading product image:', uploadError)
      return {
        success: false,
        error: uploadError.message || 'Failed to upload image',
      }
    }

    // Get the public URL
    const url = getPublicUrl(BUCKETS.PRODUCT_IMAGES, filePath)

    return {
      success: true,
      url,
    }
  } catch (error) {
    console.error('Unexpected error uploading product image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Uploads a category image to Supabase Storage
 * @param file - The image file to upload
 * @param categoryId - The category ID
 * @returns UploadResult with public URL if successful
 */
export async function uploadCategoryImage(
  file: File,
  categoryId: string
): Promise<UploadResult> {
  try {
    // Validate the image
    const validationError = validateImage(file)
    if (validationError) {
      return {
        success: false,
        error: validationError,
      }
    }

    const supabase = createAdminClient()
    const fileName = generateFileName(file.name)
    const filePath = `categories/${categoryId}/${fileName}`

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(BUCKETS.CATEGORY_IMAGES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading category image:', uploadError)
      return {
        success: false,
        error: uploadError.message || 'Failed to upload image',
      }
    }

    // Get the public URL
    const url = getPublicUrl(BUCKETS.CATEGORY_IMAGES, filePath)

    return {
      success: true,
      url,
    }
  } catch (error) {
    console.error('Unexpected error uploading category image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Uploads a hero slide image to Supabase Storage
 * @param file - The image file to upload
 * @param slideId - The hero slide ID
 * @returns UploadResult with public URL if successful
 */
export async function uploadHeroImage(
  file: File,
  slideId: string
): Promise<UploadResult> {
  try {
    // Validate the image
    const validationError = validateImage(file)
    if (validationError) {
      return {
        success: false,
        error: validationError,
      }
    }

    const supabase = createAdminClient()
    const fileName = generateFileName(file.name)
    const filePath = `slides/${slideId}/${fileName}`

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(BUCKETS.HERO_IMAGES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading hero image:', uploadError)
      return {
        success: false,
        error: uploadError.message || 'Failed to upload image',
      }
    }

    // Get the public URL
    const url = getPublicUrl(BUCKETS.HERO_IMAGES, filePath)

    return {
      success: true,
      url,
    }
  } catch (error) {
    console.error('Unexpected error uploading hero image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
