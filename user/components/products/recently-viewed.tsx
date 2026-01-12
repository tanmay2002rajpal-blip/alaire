import { getRecentlyViewed } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
import { ProductGrid } from "./product-grid"

interface RecentlyViewedProps {
  excludeProductId: string
}

export async function RecentlyViewed({ excludeProductId }: RecentlyViewedProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const products = await getRecentlyViewed(user.id, excludeProductId, 4)

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
