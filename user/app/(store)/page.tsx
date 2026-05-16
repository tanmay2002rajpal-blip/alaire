import { Metadata } from "next"
import {
  HeroCarousel,
  OnTrendPicks,
  CategoryBento,
  NewArrivals,
  LifestyleBanner,
  BestSellers,
  InstagramFeed,
  NewsletterSection,
} from "@/components/home"
import {
  getNewArrivals,
  getBestSellers,
  getCategories,
  getHeroSlides,
} from "@/lib/db/queries"
import { expandProductsByColor } from "@/lib/expand-by-color"
import { getInstagramFeed } from "@/lib/instagram/api"

export const metadata: Metadata = {
  title: "Alaire — Curated Fashion",
  description:
    "Discover curated fashion pieces that blend timeless elegance with modern design.",
}

export default async function HomePage() {
  const [
    categories,
    heroSlides,
    newArrivals,
    bestSellers,
    instagramPosts,
  ] = await Promise.all([
    getCategories(),
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
      <OnTrendPicks products={expandProductsByColor(newArrivals)} />
      <CategoryBento categories={categories} />
      <NewArrivals products={expandProductsByColor(newArrivals)} categories={categories} />
      <LifestyleBanner />
      <BestSellers products={expandProductsByColor(bestSellers)} />
      <InstagramFeed posts={instagramPosts} />
      <NewsletterSection />
    </>
  )
}
