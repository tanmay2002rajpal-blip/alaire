"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface WishlistProduct {
  id: string
  name: string
  slug: string
  base_price: number
  images: string[] | null
  variants: Array<{ price: number; compare_at_price: number | null }> | null
}

interface WishlistItem {
  id: string
  product_id: string
  product: WishlistProduct | null
}

export default function WishlistPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchWishlist() {
      if (!user) {
        setIsLoading(false)
        return
      }
      try {
        const res = await fetch("/api/account/wishlist")
        if (res.ok) {
          const data = await res.json()
          setItems(data.items || [])
        }
      } catch (err) {
        console.error("Failed to fetch wishlist:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWishlist()
  }, [user])

  const handleRemove = async (itemId: string) => {
    try {
      const res = await fetch(`/api/account/wishlist/${itemId}?userId=${user?.id}`, { method: "DELETE" })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId))
      }
    } catch {
      // non-fatal
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-6 w-36 bg-muted rounded" />
              <div className="h-4 w-56 bg-muted rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          {items.length === 0 ? (
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
              {items.map((item) => {
                const product = item.product
                if (!product) return null

                const price = product.variants?.[0]?.price ?? product.base_price ?? 0
                const compareAtPrice = product.variants?.[0]?.compare_at_price

                return (
                  <div
                    key={item.id}
                    className="group relative rounded-lg border p-4"
                  >
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-2 right-2 z-10 rounded-full p-1.5 bg-background/80 backdrop-blur-sm border hover:bg-destructive/10 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <Heart className="h-4 w-4 fill-destructive text-destructive" />
                    </button>

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
