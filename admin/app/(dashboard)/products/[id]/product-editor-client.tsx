'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Trash2, Save, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from '@/lib/actions/products'

// Type definitions
export interface Category {
  id: string
  name: string
  slug: string
}

export interface Variant {
  id?: string
  name: string
  sku: string | null
  price: number
  compare_at_price: number | null
  stock_quantity: number
  options: any
  image_url: string | null
  is_active: boolean
}

export interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string | null
  base_price: number | null
  images: string[]
  has_variants: boolean
  is_active: boolean
  created_at: string
  category_id: string | null
  category: Category | null
  variants: Variant[]
  total_stock: number
}

interface ProductEditorClientProps {
  product: ProductDetail | null
  categories: Category[]
  isNew: boolean
}

// Validation schema
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  is_active: z.boolean(),
  images: z.array(z.string()),
  base_price: z.number().min(0, 'Price must be positive').optional().nullable(),
  has_variants: z.boolean(),
})

type ProductFormData = z.infer<typeof productSchema>

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().nullable(),
  price: z.number().min(0, 'Price must be positive'),
  compare_at_price: z.number().min(0).optional().nullable(),
  stock_quantity: z.number().int().min(0, 'Stock must be non-negative'),
  image_url: z.string().optional().nullable(),
  is_active: z.boolean(),
})

type VariantFormData = z.infer<typeof variantSchema>

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ProductEditorClient({ product, categories, isNew }: ProductEditorClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [variants, setVariants] = useState<VariantFormData[]>(
    product?.variants?.map(v => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      compare_at_price: v.compare_at_price,
      stock_quantity: v.stock_quantity,
      image_url: v.image_url,
      is_active: v.is_active,
    })) || []
  )
  const [currentVariant, setCurrentVariant] = useState<VariantFormData>({
    name: '',
    sku: null,
    price: 0,
    compare_at_price: null,
    stock_quantity: 0,
    image_url: null,
    is_active: true,
  })
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      slug: product?.slug || '',
      description: product?.description || '',
      category_id: product?.category_id || '',
      is_active: product?.is_active ?? true,
      images: product?.images || [],
      base_price: product?.base_price || null,
      has_variants: product?.has_variants ?? false,
    },
  })

  const watchName = watch('name')
  const watchImages = watch('images')
  const watchIsActive = watch('is_active')

  // Auto-generate slug from name for new products
  useEffect(() => {
    if (isNew && watchName) {
      setValue('slug', slugify(watchName))
    }
  }, [watchName, isNew, setValue])

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      const productData = {
        ...data,
        variants: variants.map(v => ({
          ...v,
          id: v.id,
        })),
        category_id: data.category_id || null,
      }

      let result
      if (isNew) {
        result = await createProductAction(productData)
      } else {
        result = await updateProductAction(product!.id, productData)
      }

      if (result.success) {
        toast.success(isNew ? 'Product created successfully' : 'Product updated successfully')
        router.push('/products')
        router.refresh()
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to save product',
        })
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to save product',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!product || isNew) return

    setIsDeleting(true)
    try {
      const result = await deleteProductAction(product.id)

      if (result.success) {
        toast.success('Product deleted successfully')
        router.push('/products')
        router.refresh()
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to delete product',
        })
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to delete product',
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleAddVariant = () => {
    try {
      variantSchema.parse(currentVariant)
      if (editingVariantIndex !== null) {
        const updatedVariants = [...variants]
        updatedVariants[editingVariantIndex] = currentVariant
        setVariants(updatedVariants)
        setEditingVariantIndex(null)
        toast.success('Variant updated')
      } else {
        setVariants([...variants, currentVariant])
        toast.success('Variant added')
      }
      setCurrentVariant({ name: '', sku: null, price: 0, compare_at_price: null, stock_quantity: 0, image_url: null, is_active: true })
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Validation error', {
          description: error.issues[0].message,
        })
      }
    }
  }

  const handleEditVariant = (index: number) => {
    setCurrentVariant(variants[index])
    setEditingVariantIndex(index)
  }

  const handleDeleteVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
    toast.success('Variant removed')
  }

  const handleCancelEditVariant = () => {
    setCurrentVariant({ name: '', sku: null, price: 0, compare_at_price: null, stock_quantity: 0, image_url: null, is_active: true })
    setEditingVariantIndex(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/products')}
            disabled={isSubmitting || isDeleting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {isNew ? 'Create Product' : 'Edit Product'}
              </h1>
              {!isNew && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  watchIsActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {watchIsActive ? 'Published' : 'Draft'}
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              {isNew
                ? 'Add a new product to your catalog'
                : `Editing: ${product?.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValue('is_active', !watchIsActive)
              handleSubmit(onSubmit)()
            }}
            disabled={isSubmitting || isDeleting}
            className={watchIsActive
              ? 'border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
              : 'border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20'
            }
          >
            {watchIsActive ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isDeleting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Product
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details about your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Premium Leather Jacket"
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="premium-leather-jacket"
                    disabled={isSubmitting || isNew}
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive">{errors.slug.message}</p>
                  )}
                  {isNew && (
                    <p className="text-sm text-muted-foreground">
                      Auto-generated from product name
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe your product..."
                    rows={5}
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select
                    value={watch('category_id') || 'none'}
                    onValueChange={(value) => setValue('category_id', value === 'none' ? '' : value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-sm text-destructive">{errors.category_id.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active">Product Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {watchIsActive ? 'Product is active and visible' : 'Product is hidden'}
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={watchIsActive}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload up to 5 images. The first image will be the primary image.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={watchImages}
                  onChange={(urls) => setValue('images', Array.isArray(urls) ? urls : [urls])}
                  multiple
                  maxFiles={5}
                  bucket="product-images"
                  entityId={product?.id || 'new'}
                  disabled={isSubmitting}
                />
                {errors.images && (
                  <p className="text-sm text-destructive mt-2">{errors.images.message}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>
                  Set your product base price. Individual variant prices can be set in the Variants tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Base Price</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      {...register('base_price', {
                        valueAsNumber: true,
                        setValueAs: (v) => v === '' ? null : parseFloat(v)
                      })}
                      placeholder="0.00"
                      disabled={isSubmitting}
                    />
                    {errors.base_price && (
                      <p className="text-sm text-destructive">{errors.base_price.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Default price when no variant is selected
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="has_variants">Has Variants</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable if product has multiple options (size, color, etc.)
                      </p>
                    </div>
                    <Switch
                      id="has_variants"
                      checked={watch('has_variants')}
                      onCheckedChange={(checked) => setValue('has_variants', checked)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variants Tab */}
          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>
                  Manage different variations of this product (sizes, colors, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add/Edit Variant Form */}
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="font-semibold">
                    {editingVariantIndex !== null ? 'Edit Variant' : 'Add Variant'}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="variant_name">Name</Label>
                      <Input
                        id="variant_name"
                        value={currentVariant.name}
                        onChange={(e) =>
                          setCurrentVariant({ ...currentVariant, name: e.target.value })
                        }
                        placeholder="e.g., Large Black"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant_sku">SKU</Label>
                      <Input
                        id="variant_sku"
                        value={currentVariant.sku || ''}
                        onChange={(e) =>
                          setCurrentVariant({ ...currentVariant, sku: e.target.value || null })
                        }
                        placeholder="e.g., LJ-L-BLK"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant_price">Price</Label>
                      <Input
                        id="variant_price"
                        type="number"
                        step="0.01"
                        value={currentVariant.price}
                        onChange={(e) =>
                          setCurrentVariant({
                            ...currentVariant,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant_stock">Stock</Label>
                      <Input
                        id="variant_stock"
                        type="number"
                        value={currentVariant.stock_quantity}
                        onChange={(e) =>
                          setCurrentVariant({
                            ...currentVariant,
                            stock_quantity: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleAddVariant}
                      disabled={isSubmitting}
                      size="sm"
                    >
                      {editingVariantIndex !== null ? 'Update Variant' : 'Add Variant'}
                    </Button>
                    {editingVariantIndex !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEditVariant}
                        disabled={isSubmitting}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Variants List */}
                {variants.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Existing Variants</h3>
                    <div className="space-y-2">
                      {variants.map((variant, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="grid grid-cols-4 gap-4 flex-1">
                            <div>
                              <p className="text-sm font-medium">{variant.name}</p>
                              <p className="text-xs text-muted-foreground">Name</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{variant.sku || '-'}</p>
                              <p className="text-xs text-muted-foreground">SKU</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">${variant.price.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Price</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{variant.stock_quantity}</p>
                              <p className="text-xs text-muted-foreground">Stock</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditVariant(index)}
                              disabled={isSubmitting}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteVariant(index)}
                              disabled={isSubmitting}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No variants added yet</p>
                    <p className="text-sm">Add variants to offer different options for this product</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>
                  Stock levels are managed per variant. Add variants in the Variants tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">Total Stock</p>
                      <p className="text-sm text-muted-foreground">
                        Combined stock across all variants
                      </p>
                    </div>
                    <p className="text-3xl font-bold">
                      {variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)}
                    </p>
                  </div>
                </div>

                {variants.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Stock by Variant</h3>
                    <div className="space-y-2">
                      {variants.map((variant, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{variant.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {variant.sku || '-'}</p>
                          </div>
                          <p className="text-lg font-semibold">{variant.stock_quantity} units</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No variants added yet</p>
                    <p className="text-sm">Add variants in the Variants tab to manage stock</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </form>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <code className="bg-muted px-1 rounded">{product?.name}</code>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
