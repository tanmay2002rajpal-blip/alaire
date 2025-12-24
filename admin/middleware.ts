import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/invite']

async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!)
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('admin_session')?.value

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // Redirect to dashboard if already logged in
    if (token && await verifyTokenEdge(token)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isValid = await verifyTokenEdge(token)
  if (!isValid) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('admin_session')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
