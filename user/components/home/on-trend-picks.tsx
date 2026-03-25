"use client"

import Image from "next/image"
import Link from "next/link"
import { EmblaCarousel } from "@/components/ui/embla-carousel"
import { CATEGORY_IMAGES } from "@/lib/sample-images"
import type { Category } from "@/types"

type CategoryWithCount = Category & { product_count: number }

interface OnTrendPicksProps {
  categories: CategoryWithCount[]
}

export function OnTrendPicks({ categories }: OnTrendPicksProps) {
  if (categories.length === 0) return null

  return (
    <section className="section">
      <div className="container">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
            On-Trend <span className="font-light italic">Picks</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            Explore Our Collections
          </p>
        </div>

        <EmblaCarousel
          options={{ loop: true, align: "start" }}
          showArrows={categories.length > 3}
          slideClassName="basis-[85%] sm:basis-[45%] lg:basis-[30%] pl-4"
          className="mx-auto"
        >
          {categories.map((category) => {
            const imageUrl =
              category.image_url ||
              (CATEGORY_IMAGES as Record<string, string>)[category.slug] ||
              null

            return (
              <Link
                key={category.id}
                href={`/collection?category=${category.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                      <span className="text-5xl font-serif font-light text-accent/60">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6 bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="text-white font-medium text-lg">
                      {category.name}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {category.product_count} Products
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </EmblaCarousel>
      </div>
    </section>
  )
}
