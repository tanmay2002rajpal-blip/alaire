# Storage Setup

This directory contains utilities for managing image uploads to Supabase Storage.

## Required Storage Buckets

Before using the image upload functions, you must create the following buckets in your Supabase Dashboard:

### 1. Product Images Bucket
- **Name**: `product-images`
- **Public**: Yes (enable public access)
- **File size limit**: 5MB
- **Allowed MIME types**: image/jpeg, image/jpg, image/png, image/webp, image/gif

### 2. Category Images Bucket
- **Name**: `category-images`
- **Public**: Yes (enable public access)
- **File size limit**: 5MB
- **Allowed MIME types**: image/jpeg, image/jpg, image/png, image/webp, image/gif

### 3. Hero Images Bucket
- **Name**: `hero-images`
- **Public**: Yes (enable public access)
- **File size limit**: 5MB
- **Allowed MIME types**: image/jpeg, image/jpg, image/png, image/webp, image/gif

## How to Create Buckets

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Enter the bucket name (e.g., `product-images`)
5. Enable **Public bucket** toggle
6. Click **Create bucket**
7. Repeat for all three buckets

## Storage Policies

For public access, you may need to add the following RLS policies to each bucket:

### Allow Public Read Access
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

### Allow Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

### Allow Authenticated Delete
```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

Repeat these policies for `category-images` and `hero-images` buckets, replacing the bucket_id accordingly.

## Usage

```typescript
import {
  uploadProductImage,
  uploadCategoryImage,
  uploadHeroImage,
  deleteImage,
  getPublicUrl,
  validateImage,
} from '@/lib/storage/images'

// Upload a product image
const result = await uploadProductImage(file, productId)
if (result.success) {
  console.log('Image uploaded:', result.url)
} else {
  console.error('Upload failed:', result.error)
}

// Validate before upload
const validationError = validateImage(file)
if (validationError) {
  console.error('Invalid image:', validationError)
}

// Delete an image
await deleteImage('product-images', 'products/123/1234567890_image.jpg')

// Get public URL
const url = getPublicUrl('product-images', 'products/123/image.jpg')
```

## File Structure

Uploaded files follow this structure:

- **Product Images**: `products/{productId}/{timestamp}_{filename}`
- **Category Images**: `categories/{categoryId}/{timestamp}_{filename}`
- **Hero Images**: `slides/{slideId}/{timestamp}_{filename}`

## Image Validation

All images are validated before upload:
- Maximum file size: 5MB
- Allowed formats: JPEG, JPG, PNG, WebP, GIF
- File type validation based on MIME type
