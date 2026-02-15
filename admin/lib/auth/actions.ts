'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { signToken, setSessionCookie, clearSessionCookie, getSession } from './jwt'
import { checkRateLimit, recordLoginAttempt, clearRateLimit } from './rate-limit'
import { validateCsrfToken, generateCsrfToken, clearCsrfToken } from './csrf'
import type { AdminUser } from './types'

interface LoginResult {
  success: boolean
  error?: string
  rateLimited?: boolean
  retryAfter?: number
}

/**
 * Get the client IP address from request headers
 */
async function getClientIp(): Promise<string> {
  const headersList = await headers()
  // Check common proxy headers first
  const forwarded = headersList.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = headersList.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  // Fallback
  return 'unknown'
}

/**
 * Generate a new CSRF token for the login form
 */
export async function getLoginCsrfToken(): Promise<string> {
  return generateCsrfToken()
}

export async function login(
  email: string,
  password: string,
  csrfToken?: string
): Promise<LoginResult> {
  // Validate CSRF token
  const validCsrf = await validateCsrfToken(csrfToken || null)
  if (!validCsrf) {
    return { success: false, error: 'Invalid or expired form. Please refresh and try again.' }
  }

  // Check rate limiting
  const clientIp = await getClientIp()
  const rateLimit = checkRateLimit(clientIp)
  
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    return {
      success: false,
      error: `Too many login attempts. Please try again in ${retryAfter} seconds.`,
      rateLimited: true,
      retryAfter,
    }
  }

  // Record this attempt
  recordLoginAttempt(clientIp)

  const supabase = createAdminClient()

  // Get admin user
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !admin) {
    return { success: false, error: 'Invalid email or password' }
  }

  if (!admin.is_active) {
    return { success: false, error: 'Account is deactivated' }
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, admin.password_hash)
  if (!validPassword) {
    // Log failed attempt
    await supabase.from('activity_log').insert({
      action: 'login_failed',
      details: { email, reason: 'invalid_password' },
    })
    return { success: false, error: 'Invalid email or password' }
  }

  // Create session
  const sessionId = crypto.randomUUID()
  const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await supabase.from('admin_sessions').insert({
    id: sessionId,
    admin_id: admin.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  // Create JWT
  const token = signToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    session_id: sessionId,
  })

  await setSessionCookie(token)

  // Clear rate limit on successful login
  clearRateLimit(clientIp)

  // Clear CSRF token (new one will be generated if needed)
  await clearCsrfToken()

  // Log successful login
  await supabase.from('activity_log').insert({
    admin_id: admin.id,
    admin_name: admin.name,
    action: 'login',
    details: { email },
  })

  return { success: true }
}

export async function logout(): Promise<void> {
  const session = await getSession()

  if (session) {
    const supabase = createAdminClient()

    // Delete session from database
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('id', session.session_id)

    // Log logout
    await supabase.from('activity_log').insert({
      admin_id: session.sub,
      admin_name: session.name,
      action: 'logout',
    })
  }

  await clearSessionCookie()
  redirect('/login')
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const session = await getSession()
  if (!session) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('admin_users')
    .select('id, email, name, role, is_active, two_factor_enabled, created_at, updated_at')
    .eq('id', session.sub)
    .single()

  return data
}
