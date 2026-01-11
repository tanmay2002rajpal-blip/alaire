"use server"

import { createClient } from "@/lib/supabase/server"

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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("position")

    if (error) {
      console.error("Error fetching hero slides:", error)
      return []
    }

    return data || []
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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("hero_slides")
      .select("is_active")

    if (error) {
      console.error("Error fetching hero slide stats:", error)
      return { total: 0, active: 0, draft: 0 }
    }

    const slides = data || []
    return {
      total: slides.length,
      active: slides.filter(s => s.is_active).length,
      draft: slides.filter(s => !s.is_active).length,
    }
  } catch (err) {
    console.error("Unexpected error fetching hero slide stats:", err)
    return { total: 0, active: 0, draft: 0 }
  }
}
