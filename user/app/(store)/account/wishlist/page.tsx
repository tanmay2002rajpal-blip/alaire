import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RemoveFromWishlistButton } from "@/components/wishlist/remove-button"

interface WishlistProduct {
  id: string
  name: string
  slug: string
  base_price: number
  images: string[] | null
  variants: Array<{ price: number; compare_at_price: number | null }> | null
}

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: wishlistItems } = await supabase
    .from("wishlists")
    .select(`
      *,
      product:products(
        id,
        name,
        slug,
        base_price,
        images,
        variants:product_variants(price, compare_at_price)
      )
    `)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Wishlist</CardTitle>
          <CardDescription>
            Items you&apos;ve saved for later
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!wishlistItems || wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">Your wishlist is empty</p>
              <p className="text-sm text-muted-foreground">
                Save items you love to purchase later
              </p>
              <Link
                href="/products"
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlistItems.map((item) => {
                const product = item.product as WishlistProduct | null
                if (!product) return null

                const price = product.variants?.[0]?.price ?? product.base_price ?? 0
                const compareAtPrice = product.variants?.[0]?.compare_at_price

                return (
                  <div
                    key={item.id}
                    className="group relative rounded-lg border p-4"
                  >
                    <RemoveFromWishlistButton itemId={item.id} />

                    <Link href={`/products/${product.slug}`}>
                      <div className="relative mb-4 aspect-square overflow-hidden rounded-md bg-muted">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>

                      <h3 className="font-medium leading-tight group-hover:underline">
                        {product.name}
                      </h3>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-semibold">
                          {formatPrice(price)}
                        </span>
                        {compareAtPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </Link>

                    <Button asChild className="mt-4 w-full" size="sm">
                      <Link href={`/products/${product.slug}`}>
                        View Product
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
