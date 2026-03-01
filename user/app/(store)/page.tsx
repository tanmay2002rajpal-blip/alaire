import {
  HeroCarousel,
  HeroSection,
  CategoryGrid,
  FeaturedProducts,
  NewsletterSection,
  InstagramFeed,
} from "@/components/home"
import { getFeaturedProducts, getCategories, getHeroSlides, getHomepageStats } from "@/lib/db/queries"

export default async function HomePage() {
  const [products, categories, heroSlides, stats] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getHeroSlides(),
    getHomepageStats(),
  ])

  // Transform hero slides from database format to carousel format
  const carouselSlides = heroSlides.map((slide) => ({
    id: slide.id,
    image: slide.image_url,
    title: slide.title,
    subtitle: slide.subtitle,
    description: slide.description,
    cta: {
      text: slide.button_text ?? "Shop Now",
      href: slide.button_link ?? "/products",
    },
    align: "left" as const,
  }))

  return (
    <div className="flex flex-col">
      {/* Hero Carousel with Lifestyle Imagery */}
      <HeroCarousel slides={carouselSlides} />

      {/* Stats Section */}
      <HeroSection stats={stats} />

      {/* Featured Products */}
      <FeaturedProducts products={products} />

      {/* Categories */}
      <CategoryGrid categories={categories} />

      {/* Instagram Feed */}
      <InstagramFeed />

      {/* Newsletter Section */}
      <NewsletterSection />
    </div>
  )
}
