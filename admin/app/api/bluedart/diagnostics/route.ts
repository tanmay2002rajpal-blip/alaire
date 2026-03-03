import { NextRequest, NextResponse } from 'next/server'
import {
  getRecentDiagnostics,
  getDiagnosticsByOrderId,
  getDiagnosticsSummary,
} from '@/../../user/lib/bluedart/diagnostics'

/**
 * Blue Dart Diagnostics API for Admin
 *
 * GET /api/bluedart/diagnostics
 * Query params:
 *   - orderId: Filter by order ID
 *   - limit: Number of results (default: 20)
 *
 * Returns diagnostics data with request/response details, timing, and errors
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (orderId) {
      const diagnostics = await getDiagnosticsByOrderId(orderId)
      return NextResponse.json({
        success: true,
        data: diagnostics,
        count: diagnostics.length,
      })
    }

    const diagnostics = await getRecentDiagnostics(limit)
    const summary = await getDiagnosticsSummary()

    return NextResponse.json({
      success: true,
      data: diagnostics,
      count: diagnostics.length,
      summary,
    })
  } catch (error) {
    console.error('Diagnostics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve diagnostics',
      },
      { status: 500 }
    )
  }
}
