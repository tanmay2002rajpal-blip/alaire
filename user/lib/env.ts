/**
 * @fileoverview Environment variable validation for the user app.
 * Validates required environment variables at startup.
 *
 * @module lib/env
 */

/**
 * Required environment variables for the user app
 */
const requiredEnvVars = [
  // Database
  'MONGODB_URI',
  'MONGODB_DB',
  // Auth
  'AUTH_SECRET',
  'ADMIN_API_SECRET',
  // Payments (Razorpay)
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  // Shipping (FShip)
  'FSHIP_API_KEY',
  'FSHIP_WAREHOUSE_ID',
  // Transactional email (Resend) — powers OTP login + order notifications
  'RESEND_API_KEY',
] as const;

/**
 * Optional-but-recommended environment variables. Missing values only warn
 * (never throw) so the app still boots, but the gap is visible in logs.
 *
 * RAZORPAY_WEBHOOK_SECRET is the HMAC key for the Razorpay webhook safety net
 * (/api/webhooks/razorpay). Without it that route rejects every event, so the
 * "closed tab after capture = money taken, no order" gap re-opens.
 */
const optionalEnvVars = [
  'RAZORPAY_WEBHOOK_SECRET',
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

type EnvConfig = Record<RequiredEnvVar, string>;

/**
 * Validates that all required environment variables are set.
 * Call this at app startup to fail fast if config is missing.
 *
 * Only throws when NODE_ENV === 'production' (fail fast on bad config). In
 * other environments missing required variables are logged as a warning so
 * local development is not broken.
 *
 * @throws {Error} In production, if any required environment variable is missing
 * @returns {EnvConfig} Validated environment configuration
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const message =
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      'Please check your .env.local file and ensure all required variables are set.';

    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }

    console.warn(`[env] ${message}`);
  }

  // Optional vars: warn (don't throw) so the gap is visible without blocking boot.
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      console.warn(
        `[env] Optional environment variable not set: ${envVar}. ` +
        (envVar === 'RAZORPAY_WEBHOOK_SECRET'
          ? 'The Razorpay webhook safety net (/api/webhooks/razorpay) will reject all events until this is configured.'
          : '')
      );
    }
  }

  return Object.fromEntries(
    requiredEnvVars.map(v => [v, process.env[v] ?? '']),
  ) as EnvConfig;
}

/**
 * Get a required environment variable value.
 * Throws if the variable is not set.
 *
 * @param key - The environment variable name
 * @returns The environment variable value
 * @throws {Error} If the variable is not set
 */
export function getRequiredEnv(key: RequiredEnvVar): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Validate on module load in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
