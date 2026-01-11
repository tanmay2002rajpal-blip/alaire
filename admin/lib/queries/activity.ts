"use server"

import { createClient } from "@/lib/supabase/server"

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
    const supabase = await createClient()

    await supabase.from("activity_log").insert({
      admin_id: adminId || null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || null,
    })
  } catch (error) {
    console.error("Error logging activity:", error)
    // Don't throw - activity logging shouldn't break the main operation
  }
}
