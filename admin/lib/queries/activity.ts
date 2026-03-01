"use server"

import { ObjectId } from 'mongodb'
import { getActivityLogCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'

interface LogActivityParams {
  adminId?: string
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, any>
}

export async function logActivity({
  adminId,
  action,
  entityType,
  entityId,
  details,
}: LogActivityParams): Promise<void> {
  try {
    const activityLog = await getActivityLogCollection()

    await activityLog.insertOne({
      _id: new ObjectId(),
      admin_id: adminId ? toObjectId(adminId) : null,
      admin_name: null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || null,
      created_at: new Date(),
    })
  } catch (error) {
    console.error("Error logging activity:", error)
    // Don't throw - activity logging shouldn't break the main operation
  }
}
