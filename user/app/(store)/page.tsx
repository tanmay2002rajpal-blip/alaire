import { Metadata } from "next"
import {
  HeroCarousel,
  OnTrendPicks,
  NewArrivals,
  BestSellers,
  NewsletterSection,
  InstagramFeed,
} from "@/components/home"
import {
  getNewArrivals,
  getBestSellers,
  getCategories,
  getCategoriesWithCounts,
  getHeroSlides,
} from "@/lib/db/queries"
import { getInstagramFeed } from "@/lib/instagram/api"

export const metadata: Metadata = {
  title: "Alaire — Curated Fashion",
  description:
    "Discover curated fashion pieces that blend timeless elegance with modern design.",
}

export default async function HomePage() {
  const [
    categories,
    categoriesWithCounts,
    heroSlides,
    newArrivals,
    bestSellers,
    instagramPosts,
  ] = await Promise.all([
    getCategories(),
    getCategoriesWithCounts(),
    getHeroSlides(),
    getNewArrivals(undefined, 12),
    getBestSellers(undefined, 12),
    getInstagramFeed(8).catch(() => []),
  ])

  const slides = heroSlides.map((slide) => ({
    id: slide.id,
    image: slide.image_url,
    title: slide.title,
    subtitle: slide.subtitle || "",
    description: slide.description || "",
    cta: {
      text: slide.button_text || "Shop Now",
      href: slide.button_link || "/collection",
    },
    align: "left" as const,
  }))

  return (
    <>
      <HeroCarousel slides={slides} />
      <OnTrendPicks categories={categoriesWithCounts} />
      <NewArrivals products={newArrivals} categories={categories} />
      <BestSellers products={bestSellers} categories={categories} />
      <NewsletterSection />
      <InstagramFeed posts={instagramPosts} />
    </>
  )
}
