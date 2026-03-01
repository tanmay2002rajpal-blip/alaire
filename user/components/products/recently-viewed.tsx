import { getRecentlyViewed } from "@/lib/db/queries"
import { auth } from "@/lib/auth"
import { ProductGrid } from "./product-grid"

interface RecentlyViewedProps {
  excludeProductId: string
}

export async function RecentlyViewed({ excludeProductId }: RecentlyViewedProps) {
  const session = await auth()

  if (!session?.user?.id) return null

  const products = await getRecentlyViewed(session.user.id, excludeProductId, 4)

  if (products.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="mb-8 text-2xl font-bold tracking-tight">
        Recently Viewed
      </h2>
      <ProductGrid products={products} columns={4} />
    </section>
  )
}
