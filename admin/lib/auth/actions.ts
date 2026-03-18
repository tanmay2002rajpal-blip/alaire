'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { ObjectId } from 'mongodb'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAdminUsersCollection, getAdminSessionsCollection, getActivityLogCollection } from '@/lib/db/collections'
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

  const adminUsers = await getAdminUsersCollection()
  const activityLog = await getActivityLogCollection()

  // Get admin user
  const admin = await adminUsers.findOne({ email: email.toLowerCase() })

  if (!admin) {
    return { success: false, error: 'Invalid email or password' }
  }

  if (!admin.is_active) {
    return { success: false, error: 'Account is deactivated' }
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, admin.password_hash)
  if (!validPassword) {
    // Log failed attempt
    await activityLog.insertOne({
      _id: new ObjectId(),
      admin_id: null,
      admin_name: null,
      action: 'login_failed',
      entity_type: null,
      entity_id: null,
      details: { email, reason: 'invalid_password' },
      created_at: new Date(),
    })
    return { success: false, error: 'Invalid email or password' }
  }

  // Create session
  const sessionId = crypto.randomUUID()
  const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  const sessions = await getAdminSessionsCollection()
  await sessions.insertOne({
    _id: new ObjectId(),
    admin_id: admin._id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_at: new Date(),
  })

  // Create JWT
  const token = signToken({
    sub: admin._id.toString(),
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
  await activityLog.insertOne({
    _id: new ObjectId(),
    admin_id: admin._id,
    admin_name: admin.name,
    action: 'login',
    entity_type: null,
    entity_id: null,
    details: { email },
    created_at: new Date(),
  })

  return { success: true }
}

export async function logout(): Promise<void> {
  const session = await getSession()

  if (session) {
    const sessions = await getAdminSessionsCollection()
    const activityLog = await getActivityLogCollection()

    // Delete session from database using token_hash (session_id is a UUID, not ObjectId)
    const tokenHash = crypto.createHash('sha256').update(session.session_id).digest('hex')
    await sessions.deleteOne({ token_hash: tokenHash })

    // Log logout
    await activityLog.insertOne({
      _id: new ObjectId(),
      admin_id: new ObjectId(session.sub),
      admin_name: session.name,
      action: 'logout',
      entity_type: null,
      entity_id: null,
      details: null,
      created_at: new Date(),
    })
  }

  await clearSessionCookie()
  redirect('/login')
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const session = await getSession()
  if (!session) return null

  const adminUsers = await getAdminUsersCollection()
  const admin = await adminUsers.findOne(
    { _id: new ObjectId(session.sub) },
    { projection: { password_hash: 0 } }
  )

  if (!admin) return null

  return {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
    is_active: admin.is_active,
    two_factor_enabled: admin.two_factor_enabled,
    created_at: admin.created_at.toISOString(),
    updated_at: admin.updated_at.toISOString(),
  }
}
