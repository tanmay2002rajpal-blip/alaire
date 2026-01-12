/**
 * @fileoverview Supabase client-side (browser) client factory.
 * Creates a Supabase client for use in Client Components.
 *
 * Note: This client runs in the browser and uses the anon key.
 * For server-side operations, use ./server.ts instead.
 *
 * @module lib/supabase/client
 *
 * @example
 * ```tsx
 * "use client"
 * import { createClient } from "@/lib/supabase/client"
 *
 * function MyComponent() {
 *   const supabase = createClient()
 *   // Use supabase for real-time, auth, etc.
 * }
 * ```
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for browser/client-side usage.
 * Uses the public anon key which has RLS (Row Level Security) enabled.
 *
 * Use Cases:
 * - Real-time subscriptions
 * - Client-side auth state
 * - Client-side data fetching (with RLS)
 *
 * @returns Supabase browser client instance
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
      "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
