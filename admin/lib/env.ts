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
  'ADMIN_API_SECRET',
  'ADMIN_JWT_SECRET',
  'MONGODB_URI',
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

interface EnvConfig {
  ADMIN_API_SECRET: string;
  ADMIN_JWT_SECRET: string;
  MONGODB_URI: string;
}

/**
 * Validates that all required environment variables are set.
 * Call this at app startup to fail fast if config is missing.
 * 
 * @throws {Error} If any required environment variable is missing
 * @returns {EnvConfig} Validated environment configuration
 * 
 * @example
 * ```ts
 * import { validateEnv } from '@/lib/env'
 * const env = validateEnv() // Throws if ADMIN_API_SECRET missing
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
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  return {
    ADMIN_API_SECRET: process.env.ADMIN_API_SECRET!,
    ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET!,
    MONGODB_URI: process.env.MONGODB_URI!,
  };
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
