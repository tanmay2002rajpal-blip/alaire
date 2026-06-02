import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/jwt'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.FSHIP_API_KEY?.trim()
    const warehouseId = process.env.FSHIP_WAREHOUSE_ID?.trim()
    const configured = !!apiKey
    const fullyConfigured = configured && !!warehouseId

    return NextResponse.json({
      status: fullyConfigured ? 'healthy' : configured ? 'degraded' : 'unconfigured',
      timestamp: new Date().toISOString(),
      provider: 'fship',
      config: {
        configured,
        fullyConfigured,
        hasApiKey: !!apiKey,
        hasWarehouseId: !!warehouseId,
        sandbox: process.env.FSHIP_SANDBOX === 'true',
      },
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
