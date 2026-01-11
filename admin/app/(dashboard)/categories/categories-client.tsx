'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Loader2,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/lib/actions/categories'

interface Category {
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

type CategoryWithChildren = Category & { children: CategoryWithChildren[] }

interface CategoriesClientProps {
  initialCategories: Category[]
}

interface CategoryFormData {
  name: string
  slug: string
  description: string
  parent_id: string
  image: string
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Sync categories state when initialCategories prop changes (after router.refresh())
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    image: '',
  })

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories

    const query = searchQuery.toLowerCase().trim()
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query))
    )
  }, [categories, searchQuery])

  // Build category tree structure (use filtered categories when searching, else all)
  const categoryTree = useMemo((): CategoryWithChildren[] => {
    const categoriesToUse = searchQuery.trim() ? filteredCategories : categories
    const categoryMap = new Map<string, CategoryWithChildren>()
    const rootCategories: CategoryWithChildren[] = []

    // If searching, show flat list of results
    if (searchQuery.trim()) {
      return categoriesToUse.map((cat) => ({ ...cat, children: [] }))
    }

    // Initialize all categories with empty children array
    categoriesToUse.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Build tree structure
    categoriesToUse.forEach((cat) => {
      const category = categoryMap.get(cat.id)!
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id)
        if (parent) {
          parent.children.push(category)
        } else {
          rootCategories.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }, [categories, filteredCategories, searchQuery])

  // Get all descendant IDs of a category
  const getDescendantIds = (categoryId: string): string[] => {
    const descendants: string[] = []
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return descendants

    const findDescendants = (parentId: string) => {
      const children = categories.filter((c) => c.parent_id === parentId)
      children.forEach((child) => {
        descendants.push(child.id)
        findDescendants(child.id)
      })
    }

    findDescendants(categoryId)
    return descendants
  }

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Handle name change and auto-generate slug
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
    }))
  }

  // Open add dialog
  const handleAddCategory = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent_id: '',
      image: '',
    })
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id || '',
      image: category.image || '',
    })
    setIsDialogOpen(true)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('slug', formData.slug)
      data.append('description', formData.description)
      data.append('parent_id', formData.parent_id)
      data.append('image', formData.image)

      let result
      if (editingCategory) {
        result = await updateCategoryAction(editingCategory.id, data)
      } else {
        result = await createCategoryAction(data)
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          editingCategory
            ? 'Category updated successfully'
            : 'Category created successfully'
        )
        setIsDialogOpen(false)
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open delete confirmation
  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category)
    setIsDeleteDialogOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return

    setIsSubmitting(true)
    try {
      const result = await deleteCategoryAction(deletingCategory.id)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Category deleted successfully')
        setIsDeleteDialogOpen(false)
        setDeletingCategory(null)
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle category expansion
  const toggleExpand = (categoryId: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Get available parent categories (excluding self and descendants when editing)
  const getAvailableParents = (): Category[] => {
    if (!editingCategory) return categories

    const excludeIds = new Set([
      editingCategory.id,
      ...getDescendantIds(editingCategory.id),
    ])

    return categories.filter((cat) => !excludeIds.has(cat.id))
  }

  // Render category row
  const renderCategory = (
    category: CategoryWithChildren,
    level: number = 0
  ) => {
    const isExpanded = expandedIds.has(category.id)
    const hasChildren = category.children.length > 0
    const hasProducts = category.product_count > 0

    return (
      <div key={category.id}>
        <Card className="mb-2">
          <div className="p-4 flex items-center gap-3">
            {/* Expand/Collapse Button */}
            <div style={{ marginLeft: `${level * 24}px` }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
            </div>

            {/* Folder Icon */}
            <div className="text-muted-foreground">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-5 w-5" />
                ) : (
                  <Folder className="h-5 w-5" />
                )
              ) : (
                <Folder className="h-5 w-5" />
              )}
            </div>

            {/* Image */}
            <div className="flex-shrink-0">
              {category.image ? (
                <div className="relative w-12 h-12 rounded overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                  <Folder className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Category Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {category.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                /{category.slug}
              </p>
            </div>

            {/* Product Count */}
            <div className="text-sm text-muted-foreground">
              {category.product_count}{' '}
              {category.product_count === 1 ? 'product' : 'products'}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditCategory(category)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(category)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children.map((child) =>
              renderCategory(child, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  // Check if category can be deleted
  const canDelete = deletingCategory
    ? deletingCategory.product_count === 0 &&
      !categories.some((c) => c.parent_id === deletingCategory.id)
    : false

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your product categories and hierarchy
          </p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Info */}
      {searchQuery.trim() && (
        <p className="text-sm text-muted-foreground">
          Found {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} matching &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Category Tree */}
      <div>
        {categoryTree.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No categories yet. Create your first category to get started.
            </p>
          </Card>
        ) : (
          categoryTree.map((category) => renderCategory(category))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category information below.'
                : 'Create a new category for your products.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter category name"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="category-slug"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name, but you can customize it
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter category description"
                rows={3}
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent Category</Label>
              <Select
                value={formData.parent_id || 'none'}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, parent_id: value === 'none' ? '' : value }))
                }
              >
                <SelectTrigger id="parent_id">
                  <SelectValue placeholder="None (Top level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top level)</SelectItem>
                  {getAvailableParents().map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Category Image</Label>
              <ImageUpload
                value={formData.image ? [formData.image] : []}
                onChange={(urls) =>
                  setFormData((prev) => ({ ...prev, image: urls[0] || '' }))
                }
                maxFiles={1}
                bucket="category-images"
                entityId={editingCategory?.id || 'new'}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {deletingCategory && !canDelete ? (
                  <div className="space-y-2">
                    <span className="block">This category cannot be deleted because:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {deletingCategory.product_count > 0 && (
                        <li>
                          It contains {deletingCategory.product_count}{' '}
                          {deletingCategory.product_count === 1
                            ? 'product'
                            : 'products'}
                        </li>
                      )}
                      {categories.some(
                        (c) => c.parent_id === deletingCategory.id
                      ) && <li>It has subcategories</li>}
                    </ul>
                    <span className="block mt-2">
                      Please remove all products and subcategories first.
                    </span>
                  </div>
                ) : (
                  <span>
                    Are you sure you want to delete{' '}
                    <span className="font-semibold">
                      {deletingCategory?.name}
                    </span>
                    ? This action cannot be undone.
                  </span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            {canDelete && (
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
