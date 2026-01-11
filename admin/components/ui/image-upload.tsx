'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageIcon, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  validateImage,
  uploadProductImage,
  uploadCategoryImage,
  uploadHeroImage,
  deleteImage,
  BUCKETS,
  type UploadResult,
} from '@/lib/storage/images'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface ImageUploadProps {
  value: string | string[]
  onChange: (urls: string | string[]) => void
  multiple?: boolean
  maxFiles?: number
  bucket: 'product-images' | 'category-images' | 'hero-images'
  entityId: string
  disabled?: boolean
}

interface FileWithPreview {
  file: File
  preview: string
  id: string
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 5,
  bucket,
  entityId,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const urls = Array.isArray(value) ? value : value ? [value] : []

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const validationError = validateImage(file)
      if (validationError) {
        toast.error('Invalid file', { description: validationError })
        return null
      }

      let result: UploadResult

      switch (bucket) {
        case 'product-images':
          result = await uploadProductImage(file, entityId)
          break
        case 'category-images':
          result = await uploadCategoryImage(file, entityId)
          break
        case 'hero-images':
          result = await uploadHeroImage(file, entityId)
          break
        default:
          toast.error('Upload failed', { description: 'Invalid bucket type' })
          return null
      }

      if (!result.success || !result.url) {
        toast.error('Upload failed', { description: result.error || 'Failed to upload image' })
        return null
      }

      return result.url
    },
    [bucket, entityId]
  )

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)

      if (!multiple && fileArray.length > 1) {
        toast.error('Multiple files not allowed', { description: 'Please select only one image' })
        return
      }

      const remainingSlots = maxFiles - urls.length
      if (fileArray.length > remainingSlots) {
        toast.error('Too many files', { description: `You can only upload ${remainingSlots} more image(s)` })
        return
      }

      const filesWithPreview: FileWithPreview[] = fileArray.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
      }))

      setUploadingFiles(filesWithPreview)
      setIsUploading(true)

      try {
        const uploadPromises = filesWithPreview.map(({ file }) => uploadFile(file))
        const uploadedUrls = await Promise.all(uploadPromises)
        const successfulUrls = uploadedUrls.filter((url): url is string => url !== null)

        if (successfulUrls.length > 0) {
          const newUrls = multiple ? [...urls, ...successfulUrls] : successfulUrls
          onChange(multiple ? newUrls : newUrls[0])
          toast.success('Upload successful', { description: `${successfulUrls.length} image(s) uploaded` })
        }
      } catch (error) {
        toast.error('Upload failed', { description: error instanceof Error ? error.message : 'Failed to upload images' })
      } finally {
        filesWithPreview.forEach(({ preview }) => URL.revokeObjectURL(preview))
        setUploadingFiles([])
        setIsUploading(false)
      }
    },
    [multiple, maxFiles, urls, uploadFile, onChange]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled || isUploading) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [disabled, isUploading, handleFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
      e.target.value = ''
    },
    [handleFiles]
  )

  const handleRemoveImage = useCallback(
    async (url: string, index: number) => {
      const newUrls = urls.filter((_, i) => i !== index)
      onChange(multiple ? newUrls : '')

      const bucketName = bucket === 'product-images'
        ? BUCKETS.PRODUCT_IMAGES
        : bucket === 'category-images'
        ? BUCKETS.CATEGORY_IMAGES
        : BUCKETS.HERO_IMAGES

      const pathMatch = url.match(new RegExp(`/storage/v1/object/public/${bucketName}/(.+)$`))
      if (pathMatch && pathMatch[1]) {
        const path = pathMatch[1]
        await deleteImage(bucketName, path)
      }

      toast.success('Image removed')
    },
    [urls, onChange, multiple, bucket]
  )

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  const handleDragOverImage = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      e.stopPropagation()

      if (draggedIndex === null || draggedIndex === index) return

      const newUrls = [...urls]
      const draggedUrl = newUrls[draggedIndex]
      newUrls.splice(draggedIndex, 1)
      newUrls.splice(index, 0, draggedUrl)

      onChange(multiple ? newUrls : newUrls[0])
      setDraggedIndex(index)
    },
    [draggedIndex, urls, onChange, multiple]
  )

  const canUploadMore = urls.length < maxFiles

  return (
    <div className="space-y-4">
      {canUploadMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            'relative rounded-lg border-2 border-dashed transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <label
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-8 cursor-pointer',
              disabled && 'cursor-not-allowed'
            )}
          >
            <input
              type="file"
              multiple={multiple}
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileInput}
              disabled={disabled || isUploading}
              className="sr-only"
            />
            <div className="rounded-full bg-muted p-4">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging ? 'Drop images here' : 'Drop images here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WebP or GIF (max 5MB)
              </p>
              {multiple && (
                <p className="text-xs text-muted-foreground">
                  Upload up to {maxFiles} images
                </p>
              )}
            </div>
          </label>
        </div>
      )}

      {uploadingFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {uploadingFiles.map(({ preview, id }) => (
            <div
              key={id}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <Image
                src={preview}
                alt="Uploading"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            </div>
          ))}
        </div>
      )}

      {urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {urls.map((url, index) => (
            <div
              key={url}
              draggable={multiple && !disabled}
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverImage(e, index)}
              className={cn(
                'group relative aspect-square rounded-lg overflow-hidden bg-muted border-2 transition-all',
                multiple && !disabled && 'cursor-move hover:border-primary',
                draggedIndex === index && 'opacity-50'
              )}
            >
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
              {multiple && !disabled && (
                <div className="absolute top-2 left-2 bg-black/50 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(url, index)}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
              {index === 0 && multiple && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {urls.length === 0 && uploadingFiles.length === 0 && !canUploadMore && (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  )
}
