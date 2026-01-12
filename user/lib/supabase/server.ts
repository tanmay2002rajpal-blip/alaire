/**
 * @fileoverview Supabase server-side client factory.
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions with proper cookie handling.
 *
 * This client handles authentication cookies automatically and should be
 * used for all server-side database operations.
 *
 * @module lib/supabase/server
 *
 * @example
 * ```ts
 * // In a Server Component
 * import { createClient } from "@/lib/supabase/server"
 *
 * async function MyServerComponent() {
 *   const supabase = await createClient()
 *   const { data: products } = await supabase.from("products").select()
 *   return <ProductList products={products} />
 * }
 * ```
 *
 * @example
 * ```ts
 * // In a Route Handler
 * import { createClient } from "@/lib/supabase/server"
 *
 * export async function GET() {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // ...
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side usage.
 * Handles authentication cookies for session management.
 *
 * Features:
 * - Automatic cookie reading for auth sessions
 * - Cookie setting for session updates
 * - RLS (Row Level Security) respecting user context
 *
 * Note: This is an async function because Next.js 15+ requires
 * awaiting the cookies() call.
 *
 * @returns Promise resolving to Supabase server client instance
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
      "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        /**
         * Gets all cookies from the request.
         * Used by Supabase to read auth session tokens.
         */
        getAll() {
          return cookieStore.getAll()
        },
        /**
         * Sets cookies in the response.
         * Used by Supabase to update auth session tokens.
         *
         * Note: Setting cookies in Server Components will throw an error
         * (caught and ignored) since they're read-only contexts.
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component - cookies are read-only
            // This is expected behavior, so we silently ignore
          }
        },
      },
    }
  )
}
