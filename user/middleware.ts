import { NextRequest, NextResponse } from "next/server"
import NextAuth from "next-auth"
import authConfig from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default async function middleware(request: NextRequest) {
  const session = await auth()

  // Protected routes are now handled by client-side useAuth() in account/layout.tsx
  // to support localStorage fallback for authentication.

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
