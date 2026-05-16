import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import {
  ProductPageClient,
  ProductTabs,
  ProductGrid,
} from "@/components/products"
import { RecentlyViewed } from "@/components/products/recently-viewed"
import { getProductBySlug, getRelatedProducts, getProductReviews, getReviewSummary, canUserReview } from "@/lib/db/queries"
import { trackProductView } from "@/lib/actions/recently-viewed"
import { Separator } from "@/components/ui/separator"
import { ProductReviews } from "./product-reviews"
import { auth } from "@/lib/auth"
import type { ProductOption, ProductDetail } from "@/types"

interface ProductPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ color?: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return {
    title: product.name,
    description: product.description ?? `Shop ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.description ?? `Shop ${product.name}`,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params
  const { color: initialColor } = await searchParams
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  // Track product view (fire and forget)
  trackProductView(product.id)

  const relatedProducts = await getRelatedProducts(
    product.id,
    product.category_id,
    4
  )

  const [reviewsData, summaryData] = await Promise.all([
    getProductReviews(product.id),
    getReviewSummary(product.id),
  ])

  // Check if current user can review
  const session = await auth()
  const userCanReview = session?.user?.id ? await canUserReview(session.user.id, product.id) : false

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Product Content */}
      <ProductPageClient
        product={{
          ...product,
          options: ((product as { options?: ProductOption[] }).options) ?? [],
          category: product.category,
        }}
        initialColor={initialColor}
      />

      {/* Product Details Tabs */}
      {((product as unknown as { details?: ProductDetail[] }).details)?.length ? (
        <div className="mt-16">
          <ProductTabs details={(product as unknown as { details: ProductDetail[] }).details} />
        </div>
      ) : null}

      <Separator className="my-16" />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            You May Also Like
          </h2>
          <ProductGrid products={relatedProducts} columns={4} />
        </section>
      )}

      <Separator className="my-16" />

      {/* Customer Reviews */}
      <section>
        <ProductReviews
          productId={product.id}
          reviews={reviewsData}
          average={summaryData.average}
          count={summaryData.count}
          canReview={userCanReview}
        />
      </section>

      {/* Recently Viewed */}
      <RecentlyViewed excludeProductId={product.id} />
    </div>
  )
}
