/**
 * Blue Dart Diagnostics Module
 *
 * Persists detailed diagnostics for create-order operations to help troubleshoot
 * integration issues. Stores request/response data, timing, and error details.
 */

import { promises as fs } from 'fs'
import * as path from 'path'

// ============================================================================
// Types
// ============================================================================

export interface ShipmentDiagnostic {
  id: string
  orderId: string
  timestamp: string
  mode: 'live' | 'fallback'
  request: {
    orderId: string
    consigneeName: string
    consigneeAddress1: string
    consigneeAddress2?: string
    consigneePincode: string
    consigneeMobile: string
    productCode?: string
    subProductCode?: string
    pieceCount?: number
    weight: number
    declaredValue: number
    pickupDate: string
    pickupTime: string
  }
  response?: {
    success: boolean
    awbNumber?: string
    destinationArea?: string
    destinationLocation?: string
    pickupToken?: string
    error?: string
  }
  apiCalls: {
    waybill?: {
      requestedAt: string
      completedAt?: string
      durationMs?: number
      success: boolean
      error?: string
      httpStatus?: number
    }
    pickup?: {
      requestedAt: string
      completedAt?: string
      durationMs?: number
      success: boolean
      error?: string
      httpStatus?: number
    }
  }
  error?: {
    code: string
    category: string
    message: string
    userMessage: string
    troubleshootingSteps: string[]
    retryable: boolean
  }
  config: {
    hasLoginId: boolean
    hasLicenseKey: boolean
    hasCustomerName: boolean
    hasCustomerCode: boolean
    hasOriginArea: boolean
    apiType: string
    version: string
  }
}

// ============================================================================
// Configuration
// ============================================================================

const DIAGNOSTICS_DIR = process.env.BLUEDART_DIAGNOSTICS_DIR || '/tmp/bluedart-diagnostics'
const MAX_DIAGNOSTICS_FILES = parseInt(process.env.BLUEDART_MAX_DIAGNOSTICS_FILES || '100', 10)
const ENABLE_DIAGNOSTICS = process.env.BLUEDART_ENABLE_DIAGNOSTICS !== 'false' // Default: enabled

// ============================================================================
// Diagnostic Persistence
// ============================================================================

/**
 * Saves a shipment diagnostic to disk.
 * Creates the diagnostics directory if it doesn't exist.
 */
export async function saveDiagnostic(diagnostic: ShipmentDiagnostic): Promise<void> {
  if (!ENABLE_DIAGNOSTICS) {
    return
  }

  try {
    // Ensure diagnostics directory exists
    await fs.mkdir(DIAGNOSTICS_DIR, { recursive: true })

    // Write diagnostic file
    const filename = `${diagnostic.timestamp.replace(/[:.]/g, '-')}_${diagnostic.orderId}.json`
    const filepath = path.join(DIAGNOSTICS_DIR, filename)

    await fs.writeFile(filepath, JSON.stringify(diagnostic, null, 2), 'utf-8')

    // Cleanup old diagnostics (keep only last MAX_DIAGNOSTICS_FILES)
    await cleanupOldDiagnostics()
  } catch (error) {
    // Don't throw - diagnostics should not break the main flow
    console.error('Failed to save Blue Dart diagnostic:', error)
  }
}

/**
 * Removes old diagnostic files if we exceed MAX_DIAGNOSTICS_FILES.
 */
async function cleanupOldDiagnostics(): Promise<void> {
  try {
    const files = await fs.readdir(DIAGNOSTICS_DIR)
    const jsonFiles = files.filter((f) => f.endsWith('.json'))

    if (jsonFiles.length > MAX_DIAGNOSTICS_FILES) {
      // Sort by filename (which includes timestamp)
      jsonFiles.sort()

      // Delete oldest files
      const filesToDelete = jsonFiles.slice(0, jsonFiles.length - MAX_DIAGNOSTICS_FILES)
      for (const file of filesToDelete) {
        await fs.unlink(path.join(DIAGNOSTICS_DIR, file))
      }
    }
  } catch (error) {
    // Don't throw - cleanup failures are not critical
    console.error('Failed to cleanup old Blue Dart diagnostics:', error)
  }
}

/**
 * Retrieves recent diagnostic files for analysis.
 * Returns up to `limit` most recent diagnostics.
 */
export async function getRecentDiagnostics(limit: number = 20): Promise<ShipmentDiagnostic[]> {
  try {
    const files = await fs.readdir(DIAGNOSTICS_DIR)
    const jsonFiles = files.filter((f) => f.endsWith('.json'))

    // Sort by filename (newest first)
    jsonFiles.sort().reverse()

    // Read up to `limit` files
    const diagnostics: ShipmentDiagnostic[] = []
    for (const file of jsonFiles.slice(0, limit)) {
      try {
        const content = await fs.readFile(path.join(DIAGNOSTICS_DIR, file), 'utf-8')
        diagnostics.push(JSON.parse(content))
      } catch {
        // Skip corrupted files
      }
    }

    return diagnostics
  } catch (error) {
    console.error('Failed to read Blue Dart diagnostics:', error)
    return []
  }
}

/**
 * Retrieves diagnostics for a specific order.
 */
export async function getDiagnosticsByOrderId(orderId: string): Promise<ShipmentDiagnostic[]> {
  try {
    const files = await fs.readdir(DIAGNOSTICS_DIR)
    const orderFiles = files.filter((f) => f.includes(orderId) && f.endsWith('.json'))

    const diagnostics: ShipmentDiagnostic[] = []
    for (const file of orderFiles) {
      try {
        const content = await fs.readFile(path.join(DIAGNOSTICS_DIR, file), 'utf-8')
        diagnostics.push(JSON.parse(content))
      } catch {
        // Skip corrupted files
      }
    }

    return diagnostics.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  } catch (error) {
    console.error('Failed to read Blue Dart diagnostics for order:', error)
    return []
  }
}

/**
 * Gets summary statistics from recent diagnostics.
 */
export async function getDiagnosticsSummary(): Promise<{
  total: number
  successCount: number
  failureCount: number
  liveCount: number
  fallbackCount: number
  avgWaybillDurationMs: number
  avgPickupDurationMs: number
  commonErrors: Array<{ code: string; count: number; message: string }>
}> {
  const diagnostics = await getRecentDiagnostics(100)

  const summary = {
    total: diagnostics.length,
    successCount: 0,
    failureCount: 0,
    liveCount: 0,
    fallbackCount: 0,
    avgWaybillDurationMs: 0,
    avgPickupDurationMs: 0,
    commonErrors: [] as Array<{ code: string; count: number; message: string }>,
  }

  if (diagnostics.length === 0) {
    return summary
  }

  const errorCounts = new Map<string, { code: string; count: number; message: string }>()
  let totalWaybillDuration = 0
  let waybillCount = 0
  let totalPickupDuration = 0
  let pickupCount = 0

  for (const diag of diagnostics) {
    if (diag.response?.success) {
      summary.successCount++
    } else {
      summary.failureCount++
    }

    if (diag.mode === 'live') {
      summary.liveCount++
    } else {
      summary.fallbackCount++
    }

    if (diag.apiCalls.waybill?.durationMs) {
      totalWaybillDuration += diag.apiCalls.waybill.durationMs
      waybillCount++
    }

    if (diag.apiCalls.pickup?.durationMs) {
      totalPickupDuration += diag.apiCalls.pickup.durationMs
      pickupCount++
    }

    if (diag.error) {
      const existing = errorCounts.get(diag.error.code)
      if (existing) {
        existing.count++
      } else {
        errorCounts.set(diag.error.code, {
          code: diag.error.code,
          count: 1,
          message: diag.error.userMessage,
        })
      }
    }
  }

  summary.avgWaybillDurationMs = waybillCount > 0 ? Math.round(totalWaybillDuration / waybillCount) : 0
  summary.avgPickupDurationMs = pickupCount > 0 ? Math.round(totalPickupDuration / pickupCount) : 0
  summary.commonErrors = Array.from(errorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return summary
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a new diagnostic record for a shipment creation attempt.
 */
export function createDiagnostic(orderId: string, request: ShipmentDiagnostic['request'], mode: 'live' | 'fallback'): ShipmentDiagnostic {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    orderId,
    timestamp: new Date().toISOString(),
    mode,
    request,
    apiCalls: {},
    config: {
      hasLoginId: !!process.env.BLUEDART_LOGIN_ID,
      hasLicenseKey: !!process.env.BLUEDART_LICENSE_KEY,
      hasCustomerName: !!process.env.BLUEDART_CUSTOMER_NAME,
      hasCustomerCode: !!process.env.BLUEDART_CUSTOMER_CODE,
      hasOriginArea: !!process.env.BLUEDART_ORIGIN_AREA,
      apiType: process.env.BLUEDART_API_TYPE || 'S',
      version: process.env.BLUEDART_VERSION || '1.3',
    },
  }
}
