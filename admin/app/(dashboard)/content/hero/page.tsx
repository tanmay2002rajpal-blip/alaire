import { getHeroSlides, getHeroSlideStats } from "@/lib/queries/hero-slides"
import { HeroSlidesClient } from "./hero-slides-client"

export default async function HeroSlidesPage() {
  const [slides, stats] = await Promise.all([
    getHeroSlides(),
    getHeroSlideStats(),
  ])

  return <HeroSlidesClient slides={slides} stats={stats} />
}
