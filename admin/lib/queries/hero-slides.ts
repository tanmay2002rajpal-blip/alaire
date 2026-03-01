"use server"

import { getHeroSlidesCollection } from '@/lib/db/collections'

export interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string
  button_text: string | null
  button_link: string | null
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Get all hero slides
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const slidesCol = await getHeroSlidesCollection()

    const data = await slidesCol.find().sort({ position: 1 }).toArray()

    return data.map(slide => ({
      id: slide._id.toString(),
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      image_url: slide.image_url,
      button_text: slide.button_text,
      button_link: slide.button_link,
      position: slide.position,
      is_active: slide.is_active,
      created_at: slide.created_at.toISOString(),
      updated_at: slide.updated_at.toISOString(),
    }))
  } catch (err) {
    console.error("Unexpected error fetching hero slides:", err)
    return []
  }
}

/**
 * Get hero slide stats
 */
export async function getHeroSlideStats() {
  try {
    const slidesCol = await getHeroSlidesCollection()

    const data = await slidesCol.find(
      {},
      { projection: { is_active: 1 } }
    ).toArray()

    return {
      total: data.length,
      active: data.filter(s => s.is_active).length,
      draft: data.filter(s => !s.is_active).length,
    }
  } catch (err) {
    console.error("Unexpected error fetching hero slide stats:", err)
    return { total: 0, active: 0, draft: 0 }
  }
}
