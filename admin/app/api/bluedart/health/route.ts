import { NextResponse } from 'next/server'
import { getBlueDartHealthStatus } from '@/lib/bluedart/config'
import { getDiagnosticsSummary } from '@/lib/bluedart/diagnostics'
import { getSession } from '@/lib/auth/jwt'

/**
 * Blue Dart Health Check Endpoint for Admin
 *
 * GET /api/bluedart/health
 *
 * Returns comprehensive health status including:
 * - Configuration validation
 * - Feature availability
 * - Recent diagnostics summary
 * - Operational mode (live/fallback/unconfigured)
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const healthStatus = getBlueDartHealthStatus()
    const diagnosticsSummary = await getDiagnosticsSummary()

    return NextResponse.json({
      status: healthStatus.fullyConfigured ? 'healthy' : healthStatus.configured ? 'degraded' : 'unconfigured',
      timestamp: healthStatus.timestamp,
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
      diagnostics: diagnosticsSummary,
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
