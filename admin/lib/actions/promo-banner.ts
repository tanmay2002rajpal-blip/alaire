'use server'

import { getDb } from '@/lib/db/client'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'

export interface PromoBannerData {
  text: string
  is_active: boolean
  coupon_code?: string
  link?: string
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function getPromoBanner(): Promise<PromoBannerData | null> {
  try {
    const db = await getDb()
    const settings = await db.collection('site_settings').findOne({ key: 'promo_banner' })
    if (!settings) return null
    return settings.value as PromoBannerData
  } catch (error) {
    console.error('Error fetching promo banner:', error)
    return null
  }
}

export async function updatePromoBannerAction(data: PromoBannerData): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const db = await getDb()
    await db.collection('site_settings').updateOne(
      { key: 'promo_banner' },
      {
        $set: {
          key: 'promo_banner',
          value: {
            text: data.text,
            is_active: data.is_active,
            coupon_code: data.coupon_code || null,
            link: data.link || null,
          },
          updated_at: new Date(),
        },
      },
      { upsert: true }
    )

    revalidatePath('/content/promotions')
    return { success: true }
  } catch (error) {
    console.error('Error updating promo banner:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
