import Image from "next/image"
import Link from "next/link"
import type { Category } from "@/types"
import { CATEGORY_IMAGES } from "@/lib/sample-images"

interface CategoryQuickLinksProps {
  categories: Category[]
}

export function CategoryQuickLinks({ categories }: CategoryQuickLinksProps) {
  return (
    <section className="py-6 lg:py-8">
      <div className="container">
        <div className="flex gap-6 lg:gap-8 overflow-x-auto no-scrollbar justify-start lg:justify-center px-4 lg:px-0">
          {categories.map((category) => {
            const imageUrl =
              category.image_url ||
              (CATEGORY_IMAGES as Record<string, string>)[category.slug] ||
              null

            return (
              <Link
                key={category.id}
                href={`/collection?category=${category.slug}`}
                className="flex flex-col items-center gap-2 shrink-0 group"
              >
                <div className="relative w-[72px] h-[72px] lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-accent group-hover:scale-105 transition-all">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-accent/20 flex items-center justify-center">
                      <span className="text-xl font-serif font-semibold text-accent">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs lg:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
