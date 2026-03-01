'use server'

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Result type for upload operations
 */
export type UploadResult = {
  success: boolean
  url?: string
  error?: string
}

/**
 * Cloudinary folder paths
 */
const FOLDERS = {
  PRODUCTS: 'alaire/products',
  CATEGORIES: 'alaire/categories',
  HERO_SLIDES: 'alaire/hero-slides',
  BLOG: 'alaire/blog',
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
 */
export async function validateImage(file: File): Promise<string | null> {
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
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${timestamp}_${sanitized}`
}

/**
 * Upload a file buffer to Cloudinary
 */
async function uploadToCloudinary(
  file: File,
  folder: string,
  publicId: string
): Promise<UploadResult> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    return {
      success: true,
      url: result.secure_url,
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    }
  }
}

/**
 * Deletes an image from Cloudinary
 */
export async function deleteImage(
  _bucket: string,
  path: string
): Promise<UploadResult> {
  try {
    // Extract public_id from URL or path
    // Cloudinary URLs look like: https://res.cloudinary.com/cloud/image/upload/v123/folder/filename.ext
    let publicId = path
    if (path.includes('cloudinary.com')) {
      const match = path.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
      if (match) publicId = match[1]
    }

    await cloudinary.uploader.destroy(publicId)

    return { success: true }
  } catch (error) {
    console.error('Error deleting image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Uploads a product image to Cloudinary
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<UploadResult> {
  const validationError = await validateImage(file)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const publicId = generateFileName(file.name).replace(/\.[^.]+$/, '')
  return uploadToCloudinary(file, `${FOLDERS.PRODUCTS}/${productId}`, publicId)
}

/**
 * Uploads a category image to Cloudinary
 */
export async function uploadCategoryImage(
  file: File,
  categoryId: string
): Promise<UploadResult> {
  const validationError = await validateImage(file)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const publicId = generateFileName(file.name).replace(/\.[^.]+$/, '')
  return uploadToCloudinary(file, `${FOLDERS.CATEGORIES}/${categoryId}`, publicId)
}

/**
 * Uploads a hero slide image to Cloudinary
 */
export async function uploadHeroImage(
  file: File,
  slideId: string
): Promise<UploadResult> {
  const validationError = await validateImage(file)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const publicId = generateFileName(file.name).replace(/\.[^.]+$/, '')
  return uploadToCloudinary(file, `${FOLDERS.HERO_SLIDES}/${slideId}`, publicId)
}
