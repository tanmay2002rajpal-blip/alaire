'use server'

import { getContactMessagesCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'

interface ActionResult {
  success: boolean
  error?: string
}

/**
 * Server action to update a contact message's status
 */
export async function updateMessageStatusAction(
  messageId: string,
  status: 'unread' | 'read' | 'replied'
): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!messageId) {
      return { success: false, error: 'Message ID is required' }
    }

    const col = await getContactMessagesCollection()
    const oid = toObjectId(messageId)

    const result = await col.updateOne(
      { _id: oid },
      { $set: { status } }
    )

    if (result.matchedCount === 0) {
      return { success: false, error: 'Message not found' }
    }

    revalidatePath('/messages')
    return { success: true }
  } catch (error) {
    console.error('Error updating message status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to delete a contact message
 */
export async function deleteMessageAction(
  messageId: string
): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!messageId) {
      return { success: false, error: 'Message ID is required' }
    }

    const col = await getContactMessagesCollection()
    const oid = toObjectId(messageId)

    const result = await col.deleteOne({ _id: oid })

    if (result.deletedCount === 0) {
      return { success: false, error: 'Message not found' }
    }

    revalidatePath('/messages')
    return { success: true }
  } catch (error) {
    console.error('Error deleting message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
