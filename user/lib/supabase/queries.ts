/**
 * @fileoverview Supabase queries - Re-export module.
 *
 * This file maintains backward compatibility by re-exporting
 * from the new modular query structure in ./queries/
 *
 * For new code, prefer importing directly from the specific modules:
 * @example
 * ```ts
 * // Preferred: Import from specific module
 * import { getProducts } from '@/lib/supabase/queries/products'
 *
 * // Also works: Import from this file
 * import { getProducts } from '@/lib/supabase/queries'
 * ```
 *
 * @module lib/supabase/queries
 * @deprecated Import from specific query modules instead
 */

// Re-export everything from the new modular structure
export * from "./queries/index"
