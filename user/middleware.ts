import { NextRequest, NextResponse } from "next/server"
import NextAuth from "next-auth"
import authConfig from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default async function middleware(request: NextRequest) {
  const session = await auth()

  // Protected routes that require authentication
  const protectedPaths = ["/account/orders", "/account/wishlist", "/account/wallet"]
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
