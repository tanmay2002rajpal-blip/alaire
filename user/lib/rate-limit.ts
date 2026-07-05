/**
 * @fileoverview Rate limiter backed by a MongoDB TTL collection so limits
 * persist across serverless instances (in-memory maps reset per cold start and
 * are not shared between concurrent lambdas).
 *
 * A fixed-window counter is stored per identifier. A TTL index on `expires_at`
 * lets MongoDB reclaim stale documents automatically.
 *
 * @module lib/rate-limit
 */

import { getDb } from "@/lib/db/client"

/** Collection used to persist rate-limit counters */
const COLLECTION = "rate_limits"

interface RateLimitDoc {
  /** The rate-limit identifier (e.g. `otp-email:foo@bar.com`) */
  _id: string
  /** Number of requests observed in the current window */
  count: number
  /** When the current window started */
  window_start: Date
  /** TTL anchor — MongoDB removes the doc once this passes */
  expires_at: Date
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

/** Ensure the TTL index exists (best-effort, runs once per instance) */
let indexPromise: Promise<void> | null = null
async function ensureIndex(): Promise<void> {
  if (!indexPromise) {
    indexPromise = (async () => {
      try {
        const db = await getDb()
        await db
          .collection(COLLECTION)
          .createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
      } catch (err) {
        // Non-fatal — the limiter still works without the TTL sweep.
        console.error("rate-limit: failed to ensure TTL index", err)
        indexPromise = null
      }
    })()
  }
  return indexPromise
}

/**
 * Checks and updates the rate limit for a given identifier using a persistent
 * MongoDB-backed fixed window.
 *
 * Fails open (allows the request) if the database is unreachable so a transient
 * outage never locks legitimate users out.
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID, email key)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 *
 * @example
 * ```ts
 * const result = await checkRateLimit(clientIp, { maxRequests: 5, windowMs: 60000 })
 * if (!result.allowed) {
 *   return new Response('Too many requests', { status: 429 })
 * }
 * ```
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()

  try {
    await ensureIndex()
    const db = await getDb()
    const col = db.collection<RateLimitDoc>(COLLECTION)

    const doc = await col.findOne({ _id: identifier })

    // No document, or the previous window has fully elapsed → start fresh.
    if (!doc || doc.window_start.getTime() + config.windowMs <= now) {
      const expiresAt = new Date(now + config.windowMs)
      await col.updateOne(
        { _id: identifier },
        {
          $set: {
            count: 1,
            window_start: new Date(now),
            expires_at: expiresAt,
          },
        },
        { upsert: true }
      )
      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - 1),
        resetIn: config.windowMs,
      }
    }

    const windowEnd = doc.window_start.getTime() + config.windowMs
    const resetIn = Math.max(0, windowEnd - now)

    // Limit already reached within the active window.
    if (doc.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetIn }
    }

    // Within window and under the cap → count this request.
    await col.updateOne({ _id: identifier }, { $inc: { count: 1 } })
    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - doc.count - 1),
      resetIn,
    }
  } catch (err) {
    // Fail open on infrastructure errors rather than blocking real users.
    console.error("rate-limit: check failed, allowing request", err)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetIn: config.windowMs,
    }
  }
}

/**
 * Extracts client IP from request headers.
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP). Best-effort:
 * these headers are spoofable unless set by a trusted proxy in front of the app.
 *
 * @param request - Incoming HTTP request
 * @returns Client IP address or a fallback identifier
 */
export function getClientIp(request: Request): string {
  // X-Forwarded-For may contain multiple IPs; the first is the original client.
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim()
    if (firstIp) return firstIp
  }

  // X-Real-IP is set by some proxies (e.g. nginx).
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp

  return "unknown"
}
