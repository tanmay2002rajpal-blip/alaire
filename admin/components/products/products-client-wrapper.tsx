'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Power, PowerOff, Loader2, X } from 'lucide-react'
import { ProductsTable } from './products-table'
import { Button } from '@/components/ui/button'
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
import { bulkDeleteProductsAction, bulkUpdateProductStatusAction } from '@/lib/actions/products'

interface Product {
  id: string
  name: string
  slug: string
  images: string[]
  category_name: string
  price: number
  stock: number
  is_active: boolean
  created_at: string
}

interface ProductsClientWrapperProps {
  products: Product[]
}

export function ProductsClientWrapper({ products }: ProductsClientWrapperProps) {
  const router = useRouter()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async () => {
    if (selectedProducts.length === 0) return

    setIsDeleting(true)
    try {
      const result = await bulkDeleteProductsAction(selectedProducts)
      if (result.success) {
        toast.success(`Successfully deleted ${selectedProducts.length} product(s)`)
        setSelectedProducts([])
        setShowDeleteDialog(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete products')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusUpdate = async (isActive: boolean) => {
    if (selectedProducts.length === 0) return

    setIsUpdating(true)
    try {
      const result = await bulkUpdateProductStatusAction(selectedProducts, isActive)
      if (result.success) {
        toast.success(`Successfully ${isActive ? 'activated' : 'deactivated'} ${selectedProducts.length} product(s)`)
        setSelectedProducts([])
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update products')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 border rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedProducts.length} {selectedProducts.length === 1 ? 'product' : 'products'} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProducts([])}
              className="h-6 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate(true)}
              disabled={isUpdating || isDeleting}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Power className="h-4 w-4 mr-1" />
              )}
              Set Active
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate(false)}
              disabled={isUpdating || isDeleting}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <PowerOff className="h-4 w-4 mr-1" />
              )}
              Set Inactive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isUpdating || isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <ProductsTable
        products={products}
        selectedProducts={selectedProducts}
        onSelectionChange={setSelectedProducts}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProducts.length} {selectedProducts.length === 1 ? 'product' : 'products'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
