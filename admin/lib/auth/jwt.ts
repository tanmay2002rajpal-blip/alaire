import jwt from 'jsonwebtoken'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { getAdminSessionsCollection, getAdminUsersCollection } from '@/lib/db/collections'
import type { JWTPayload } from './types'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET!
const COOKIE_NAME = 'admin_session'
const TOKEN_EXPIRY = '24h'

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  // 1. Verify the JWT signature/expiry.
  const payload = verifyToken(token)
  if (!payload) return null

  // 2. Verify the session row still exists (logout deletes it) and the admin is
  //    still active (deactivation must revoke access) on every request.
  try {
    const sessions = await getAdminSessionsCollection()
    const tokenHash = createHash('sha256').update(payload.session_id).digest('hex')
    const sessionRow = await sessions.findOne({ token_hash: tokenHash })

    if (!sessionRow) return null
    if (sessionRow.expires_at && sessionRow.expires_at.getTime() < Date.now()) return null

    const adminUsers = await getAdminUsersCollection()
    const admin = await adminUsers.findOne(
      { _id: sessionRow.admin_id },
      { projection: { is_active: 1 } }
    )
    if (!admin || admin.is_active === false) return null
  } catch (err) {
    // Fail closed: if the session cannot be verified, deny access.
    console.error('getSession verification error:', err)
    return null
  }

  return payload
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
