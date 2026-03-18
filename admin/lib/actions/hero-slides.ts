'use server'

import { ObjectId } from 'mongodb'
import { getHeroSlidesCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'

interface ActionResult {
  success: boolean
  error?: string
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
