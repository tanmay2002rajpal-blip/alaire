'use server'

import { ObjectId } from 'mongodb'
import { getHeroSlidesCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'

interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

export interface HeroSlideInput {
  title: string
  subtitle?: string
  description?: string
  image_url: string
  button_text?: string
  button_link?: string
  is_active: boolean
}

/**
 * Create a new hero slide
 */
export async function createHeroSlideAction(data: HeroSlideInput): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const slidesCol = await getHeroSlidesCollection()

    // Get max position
    const maxSlide = await slidesCol.find().sort({ position: -1 }).limit(1).toArray()
    const position = maxSlide.length > 0 ? (maxSlide[0].position || 0) + 1 : 0

    const result = await slidesCol.insertOne({
      _id: new ObjectId(),
      title: data.title,
      subtitle: data.subtitle || null,
      description: data.description || null,
      image_url: data.image_url,
      button_text: data.button_text || null,
      button_link: data.button_link || null,
      position,
      is_active: data.is_active,
      created_at: new Date(),
      updated_at: new Date(),
    })

    revalidatePath('/content/hero')
    return { success: true, id: result.insertedId.toString() }
  } catch (error) {
    console.error('Error creating hero slide:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Update an existing hero slide
 */
export async function updateHeroSlideAction(slideId: string, data: HeroSlideInput): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const slidesCol = await getHeroSlidesCollection()
    const oid = toObjectId(slideId)

    await slidesCol.updateOne(
      { _id: oid },
      {
        $set: {
          title: data.title,
          subtitle: data.subtitle || null,
          description: data.description || null,
          image_url: data.image_url,
          button_text: data.button_text || null,
          button_link: data.button_link || null,
          is_active: data.is_active,
          updated_at: new Date(),
        },
      }
    )

    revalidatePath('/content/hero')
    return { success: true }
  } catch (error) {
    console.error('Error updating hero slide:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a hero slide
 */
export async function deleteHeroSlideAction(slideId: string): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const slidesCol = await getHeroSlidesCollection()
    const oid = toObjectId(slideId)

    const result = await slidesCol.deleteOne({ _id: oid })

    if (result.deletedCount === 0) {
      return { success: false, error: 'Slide not found' }
    }

    revalidatePath('/content/hero')
    return { success: true }
  } catch (error) {
    console.error('Error deleting hero slide:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Toggle hero slide active status
 */
export async function toggleHeroSlideAction(slideId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const slidesCol = await getHeroSlidesCollection()
    const oid = toObjectId(slideId)

    await slidesCol.updateOne(
      { _id: oid },
      { $set: { is_active: isActive, updated_at: new Date() } }
    )

    revalidatePath('/content/hero')
    return { success: true }
  } catch (error) {
    console.error('Error toggling hero slide:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
