import NextAuth from "next-auth"
import authConfig from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthRoute = pathname.startsWith("/account") || pathname.startsWith("/checkout")

  if (isAuthRoute && !req.auth) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*"],
}
