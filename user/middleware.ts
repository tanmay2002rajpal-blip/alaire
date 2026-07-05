import NextAuth from "next-auth"
import authConfig from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthRoute = pathname.startsWith("/account") || pathname.startsWith("/checkout")

  if (isAuthRoute && !req.auth) {
    // Send guests home but flag that auth is required so the storefront
    // auto-opens the sign-in popup instead of silently landing on home.
    const redirectUrl = new URL("/", req.url)
    redirectUrl.searchParams.set("authRequired", "1")
    if (pathname.startsWith("/checkout")) redirectUrl.searchParams.set("next", "/checkout")
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*"],
}
