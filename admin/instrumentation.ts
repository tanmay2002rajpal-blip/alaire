/**
 * @fileoverview Next.js instrumentation hook for the admin app.
 *
 * Next.js 16 automatically calls the exported `register()` function once at
 * server startup (no config required). We use it to wire up two previously
 * dead safety nets:
 *
 *   1. validateEnv()   — fail fast on misconfiguration. Allowed to throw in
 *                        production so a bad config crashes boot loudly
 *                        instead of failing silently at request time.
 *   2. ensureIndexes() — idempotently create all required MongoDB indexes.
 *                        Wrapped so a failure here logs but never blocks boot.
 *
 * Only runs on the Node.js runtime (not Edge), where DB access and full
 * `process.env` are available.
 *
 * @module instrumentation
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  // Validate environment. In production this throws on missing config — that
  // is intentional (fail fast). In dev it is non-fatal (see lib/env.ts).
  const { validateEnv } = await import('./lib/env')
  validateEnv()

  // Ensure DB indexes exist. Never let index setup crash the server boot.
  try {
    const { ensureIndexes } = await import('./lib/db/ensure-indexes')
    await ensureIndexes()
  } catch (err) {
    console.error(
      '[instrumentation] ensureIndexes() failed during startup:',
      err instanceof Error ? err.message : err
    )
  }
}
