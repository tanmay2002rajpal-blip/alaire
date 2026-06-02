import { NextResponse } from 'next/server'
import { getFShipHealthStatus } from '@/lib/fship/config'
import { getRecentDiagnostics } from '@/lib/fship/diagnostics'

export async function GET() {
  try {
    const healthStatus = getFShipHealthStatus()
    const recentDiagnostics = await getRecentDiagnostics(10)

    const successCount = recentDiagnostics.filter(d => d.response?.success).length
    const failureCount = recentDiagnostics.length - successCount

    return NextResponse.json({
      status: healthStatus.fullyConfigured ? 'healthy' : healthStatus.configured ? 'degraded' : 'unconfigured',
      timestamp: healthStatus.timestamp,
      provider: 'fship',
      config: {
        mode: healthStatus.mode,
        configured: healthStatus.configured,
        fullyConfigured: healthStatus.fullyConfigured,
        features: healthStatus.features,
      },
      validation: {
        errors: healthStatus.validation.errors,
        warnings: healthStatus.validation.warnings,
      },
      diagnostics: {
        total: recentDiagnostics.length,
        successCount,
        failureCount,
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
