import { Suspense } from "react"
import { getBestSellerProducts } from "@/lib/queries/analytics"
import { BestSellersClient } from "./best-sellers-client"

export const metadata = {
  title: "Best Sellers | Analytics",
}

export default async function BestSellersPage() {
  const products = await getBestSellerProducts(20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Best Sellers</h1>
        <p className="text-muted-foreground">
          Product performance ranked by units sold
        </p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
        <BestSellersClient products={products} />
      </Suspense>
    </div>
  )
}
