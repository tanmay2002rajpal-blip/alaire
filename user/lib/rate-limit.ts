/**
 * @fileoverview Simple in-memory rate limiter for API protection.
 * Uses a sliding window approach to limit requests per IP/identifier.
 *
 * @module lib/rate-limit
 */

interface RateLimitEntry {
  /** Timestamps of recent requests */
  timestamps: number[]
}

/** In-memory store for rate limit tracking */
const rateLimitStore = new Map<string, RateLimitEntry>()

/** Cleanup interval to prevent memory leaks (5 minutes) */
const CLEANUP_INTERVAL = 5 * 60 * 1000

// Periodic cleanup of stale entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove entries with no recent requests
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 60000) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Number of remaining requests in the window */
  remaining: number
  /** Time in ms until the rate limit resets */
  resetIn: number
}

/**
 * Checks and updates rate limit for a given identifier.
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 *
 * @example
 * ```ts
 * const result = checkRateLimit(clientIp, { maxRequests: 5, windowMs: 60000 })
 * if (!result.allowed) {
 *   return new Response('Too many requests', { status: 429 })
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Get or create entry for this identifier
  let entry = rateLimitStore.get(identifier)
  if (!entry) {
    entry = { timestamps: [] }
    rateLimitStore.set(identifier, entry)
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)

  // Check if limit exceeded
  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const resetIn = oldestInWindow + config.windowMs - now

    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.max(0, resetIn),
    }
  }

  // Add current request timestamp
  entry.timestamps.push(now)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetIn: config.windowMs,
  }
}

/**
 * Extracts client IP from request headers.
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP).
 *
 * @param request - Incoming HTTP request
 * @returns Client IP address or fallback identifier
 */
export function getClientIp(request: Request): string {
  // Check X-Forwarded-For (may contain multiple IPs, first is client)
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim()
    if (firstIp) return firstIp
  }

  // Check X-Real-IP
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp

  // Fallback to a hash of user-agent + timestamp bucket (not ideal but better than nothing)
  const ua = request.headers.get("user-agent") || "unknown"
  return `ua-${ua.slice(0, 50)}`
}
