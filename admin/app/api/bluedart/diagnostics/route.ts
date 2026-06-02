import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/jwt'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      provider: 'fship',
      message: 'Diagnostics available via FShip dashboard at app.fship.in',
    })
  } catch (error) {
    console.error('Diagnostics API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
