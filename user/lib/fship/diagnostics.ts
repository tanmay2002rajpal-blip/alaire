import { promises as fs } from 'fs'
import * as path from 'path'

export interface ShipmentDiagnostic {
  id: string
  orderId: string
  timestamp: string
  mode: 'live' | 'sandbox'
  request: {
    orderId: string
    consigneeName: string
    consigneeAddress1: string
    consigneeAddress2?: string
    consigneePincode: string
    consigneeMobile: string
    weight: number
    declaredValue: number
  }
  response?: {
    success: boolean
    awbNumber?: string
    apiOrderId?: number
    courierName?: string
    error?: string
  }
  apiCalls: {
    createOrder?: {
      requestedAt: string
      completedAt?: string
      durationMs?: number
      success: boolean
      error?: string
    }
    registerPickup?: {
      requestedAt: string
      completedAt?: string
      durationMs?: number
      success: boolean
      error?: string
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
    hasApiKey: boolean
    hasWarehouseId: boolean
    sandbox: boolean
  }
}

const DIAGNOSTICS_DIR = process.env.FSHIP_DIAGNOSTICS_DIR || '/tmp/fship-diagnostics'
const MAX_DIAGNOSTICS_FILES = parseInt(process.env.FSHIP_MAX_DIAGNOSTICS_FILES || '100', 10)
const ENABLE_DIAGNOSTICS = process.env.FSHIP_ENABLE_DIAGNOSTICS !== 'false'

export async function saveDiagnostic(diagnostic: ShipmentDiagnostic): Promise<void> {
  if (!ENABLE_DIAGNOSTICS) return

  try {
    await fs.mkdir(DIAGNOSTICS_DIR, { recursive: true })
    const filename = `${diagnostic.timestamp.replace(/[:.]/g, '-')}_${diagnostic.orderId}.json`
    const filepath = path.join(DIAGNOSTICS_DIR, filename)
    await fs.writeFile(filepath, JSON.stringify(diagnostic, null, 2), 'utf-8')
    await cleanupOldDiagnostics()
  } catch (error) {
    console.error('Failed to save FShip diagnostic:', error)
  }
}

async function cleanupOldDiagnostics(): Promise<void> {
  try {
    const files = await fs.readdir(DIAGNOSTICS_DIR)
    const jsonFiles = files.filter((f) => f.endsWith('.json'))
    if (jsonFiles.length > MAX_DIAGNOSTICS_FILES) {
      jsonFiles.sort()
      const filesToDelete = jsonFiles.slice(0, jsonFiles.length - MAX_DIAGNOSTICS_FILES)
      for (const file of filesToDelete) {
        await fs.unlink(path.join(DIAGNOSTICS_DIR, file))
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old FShip diagnostics:', error)
  }
}

export async function getRecentDiagnostics(limit: number = 20): Promise<ShipmentDiagnostic[]> {
  try {
    const files = await fs.readdir(DIAGNOSTICS_DIR)
    const jsonFiles = files.filter((f) => f.endsWith('.json'))
    jsonFiles.sort().reverse()
    const diagnostics: ShipmentDiagnostic[] = []
    for (const file of jsonFiles.slice(0, limit)) {
      try {
        const content = await fs.readFile(path.join(DIAGNOSTICS_DIR, file), 'utf-8')
        diagnostics.push(JSON.parse(content))
      } catch { /* skip corrupted */ }
    }
    return diagnostics
  } catch {
    return []
  }
}

export function createDiagnostic(
  orderId: string,
  request: ShipmentDiagnostic['request'],
  mode: 'live' | 'sandbox'
): ShipmentDiagnostic {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    orderId,
    timestamp: new Date().toISOString(),
    mode,
    request,
    apiCalls: {},
    config: {
      hasApiKey: !!process.env.FSHIP_API_KEY,
      hasWarehouseId: !!process.env.FSHIP_WAREHOUSE_ID,
      sandbox: process.env.FSHIP_SANDBOX === 'true',
    },
  }
}
