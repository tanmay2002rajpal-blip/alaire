/**
 * @fileoverview Simple in-memory rate limiter for login attempts.
 * Prevents brute force attacks by limiting attempts per IP.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limiting (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const MAX_ATTEMPTS = 5         // Maximum login attempts
const WINDOW_MS = 60 * 1000    // Time window: 1 minute

/**
 * Check if an IP is rate limited
 * @param ip - The IP address to check
 * @returns Object with allowed status and remaining attempts
 */
export function checkRateLimit(ip: string): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const key = `login:${ip}`
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    cleanupExpired()
  }
  
  const entry = rateLimitStore.get(key)
  
  // No entry or expired - allow
  if (!entry || entry.resetAt < now) {
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS,
      resetAt: now + WINDOW_MS,
    }
  }
  
  // Check if within limit
  const remaining = Math.max(0, MAX_ATTEMPTS - entry.count)
  return {
    allowed: entry.count < MAX_ATTEMPTS,
    remaining,
    resetAt: entry.resetAt,
  }
}

/**
 * Record a login attempt for an IP
 * @param ip - The IP address to record
 */
export function recordLoginAttempt(ip: string): void {
  const now = Date.now()
  const key = `login:${ip}`
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetAt < now) {
    // Create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
  } else {
    // Increment existing entry
    entry.count++
    rateLimitStore.set(key, entry)
  }
}

/**
 * Clear rate limit for an IP (e.g., after successful login)
 * @param ip - The IP address to clear
 */
export function clearRateLimit(ip: string): void {
  rateLimitStore.delete(`login:${ip}`)
}

/**
 * Clean up expired entries to prevent memory leaks
 */
function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}
