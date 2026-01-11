import { notFound } from 'next/navigation'
import { getProductById, getCategories } from '@/lib/queries/products'
import { ProductEditorClient } from './product-editor-client'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const isNew = id === 'new'

  // Fetch product data if editing
  let product = null
  if (!isNew) {
    product = await getProductById(id)
    if (!product) {
      notFound()
    }
  }

  // Fetch categories
  const categories = await getCategories()

  return (
    <ProductEditorClient
      product={product}
      categories={categories}
      isNew={isNew}
    />
  )
}
