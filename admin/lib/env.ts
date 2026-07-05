/**
 * @fileoverview Environment variable validation for the admin app.
 * Validates required environment variables at startup.
 * 
 * @module lib/env
 */

/**
 * Required environment variables for the admin app
 */
const requiredEnvVars = [
  // Database
  'MONGODB_URI',
  'MONGODB_DB',
  // Auth
  'ADMIN_JWT_SECRET',
  'ADMIN_API_SECRET',
  // Media (Cloudinary)
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  // Transactional email (Resend)
  'RESEND_API_KEY',
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
 *
 * @example
 * ```ts
 * import { validateEnv } from '@/lib/env'
 * const env = validateEnv() // Throws (in production) if ADMIN_API_SECRET missing
 * ```
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
