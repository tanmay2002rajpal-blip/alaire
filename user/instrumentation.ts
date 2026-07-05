/**
 * @fileoverview Next.js instrumentation hook for the user app.
 *
 * Next.js 16 automatically calls the exported `register()` function once at
 * server startup (no config required). We use it to run environment
 * validation — a previously dead safety net that would otherwise let a
 * misconfigured deployment fail silently at request time.
 *
 * validateEnv() is allowed to throw in production (fail fast on bad config);
 * in development it is non-fatal (see lib/env.ts). The user app has no admin
 * index script, so env validation is the only startup task here.
 *
 * Only runs on the Node.js runtime (not Edge), where full `process.env` is
 * available.
 *
 * @module instrumentation
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  const { validateEnv } = await import('./lib/env')
  validateEnv()
}
