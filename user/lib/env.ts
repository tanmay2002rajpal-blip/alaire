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
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'MONGODB_URI',
  'AUTH_SECRET',
  'ADMIN_API_SECRET',
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

interface EnvConfig {
  NEXT_PUBLIC_RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  MONGODB_URI: string;
  AUTH_SECRET: string;
  ADMIN_API_SECRET: string;
}

/**
 * Validates that all required environment variables are set.
 * Call this at app startup to fail fast if config is missing.
 *
 * @throws {Error} If any required environment variable is missing
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
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  return {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET!,
    MONGODB_URI: process.env.MONGODB_URI!,
    AUTH_SECRET: process.env.AUTH_SECRET!,
    ADMIN_API_SECRET: process.env.ADMIN_API_SECRET!,
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
