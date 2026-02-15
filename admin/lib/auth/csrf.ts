/**
 * @fileoverview CSRF token generation and validation.
 * Uses secure random tokens stored in cookies.
 */

import { cookies } from 'next/headers'
import * as crypto from 'crypto'

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_TOKEN_LENGTH = 32
const CSRF_MAX_AGE = 60 * 60 * 24 // 24 hours

/**
 * Generate a new CSRF token and store it in a cookie
 * @returns The generated CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_MAX_AGE,
    path: '/',
  })
  
  return token
}

/**
 * Get the current CSRF token from the cookie
 * @returns The CSRF token or null if not set
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CSRF_COOKIE_NAME)
  return token?.value || null
}

/**
 * Validate a CSRF token against the stored cookie value
 * @param token - The token submitted with the form
 * @returns True if valid, false otherwise
 */
export async function validateCsrfToken(token: string | null): Promise<boolean> {
  if (!token) return false
  
  const storedToken = await getCsrfToken()
  if (!storedToken) return false
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(storedToken)
    )
  } catch {
    // Buffers of different lengths will throw
    return false
  }
}

/**
 * Clear the CSRF token cookie
 */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_COOKIE_NAME)
}
