/**
 * @fileoverview Idempotent MongoDB index creation for the admin app.
 *
 * Exports {@link ensureIndexes}, an importable, safe-to-call-repeatedly
 * function that creates every index the manual `scripts/create-indexes.ts`
 * used to create. It is invoked automatically at server boot from
 * `instrumentation.ts` and can also be run manually via `npm run db:indexes`.
 *
 * `createIndex` is idempotent by nature — re-creating an index with the same
 * spec is a no-op. To keep boot resilient, every call is wrapped so that an
 * "already exists" / options-conflict error is logged and swallowed rather
 * than crashing the process.
 *
 * @module lib/db/ensure-indexes
 */

import type { IndexSpecification, CreateIndexesOptions } from 'mongodb'
import { getDb } from './client'

interface IndexDefinition {
  key: IndexSpecification
  options?: CreateIndexesOptions
}

/**
 * The complete set of collections and their indexes for the admin app.
 * This mirrors the historical `scripts/create-indexes.ts` index set exactly,
 * including all unique/sparse/TTL options.
 */
const INDEXES: Record<string, IndexDefinition[]> = {
  admin_users: [
    { key: { email: 1 }, options: { unique: true } },
  ],
  admin_sessions: [
    { key: { admin_id: 1 } },
    { key: { token_hash: 1 } },
    { key: { expires_at: 1 }, options: { expireAfterSeconds: 0 } }, // TTL index
  ],
  activity_log: [
    { key: { admin_id: 1 } },
    { key: { created_at: -1 } },
    { key: { entity_type: 1, entity_id: 1 } },
  ],
  products: [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { category_id: 1 } },
    { key: { is_active: 1 } },
    { key: { created_at: -1 } },
    { key: { name: 'text', description: 'text' } },
  ],
  product_variants: [
    { key: { product_id: 1 } },
    { key: { sku: 1 }, options: { sparse: true } },
    { key: { is_active: 1, stock_quantity: 1 } },
  ],
  categories: [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { parent_id: 1 } },
    { key: { position: 1 } },
  ],
  orders: [
    { key: { order_number: 1 }, options: { unique: true } },
    // Defense-in-depth for prepaid idempotency: at most one order per Razorpay
    // order id. PARTIAL (not sparse) so the constraint applies ONLY when
    // razorpay_order_id is a string — COD orders store null, and a sparse index
    // still indexes null (causing E11000 on the 2nd COD order), whereas a
    // partialFilterExpression on $type:'string' exempts them correctly.
    { key: { razorpay_order_id: 1 }, options: { unique: true, partialFilterExpression: { razorpay_order_id: { $type: 'string' } } } },
    { key: { user_id: 1 } },
    { key: { status: 1 } },
    { key: { created_at: -1 } },
  ],
  order_items: [
    { key: { order_id: 1 } },
    { key: { product_id: 1 } },
  ],
  order_status_history: [
    { key: { order_id: 1, created_at: -1 } },
  ],
  users: [
    { key: { email: 1 }, options: { unique: true, sparse: true } },
    { key: { created_at: -1 } },
    { key: { is_active: 1 } },
  ],
  addresses: [
    { key: { user_id: 1 } },
  ],
  coupons: [
    { key: { code: 1 }, options: { unique: true } },
    { key: { is_active: 1 } },
    { key: { valid_from: 1, valid_until: 1 } },
  ],
  hero_slides: [
    { key: { position: 1 } },
    { key: { is_active: 1 } },
  ],
  blog_posts: [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { is_published: 1 } },
    { key: { created_at: -1 } },
  ],
  newsletter_subscribers: [
    { key: { email: 1 }, options: { unique: true } },
    { key: { is_active: 1 } },
  ],
  wallets: [
    { key: { user_id: 1 }, options: { unique: true } },
  ],
  wallet_transactions: [
    { key: { wallet_id: 1 } },
    { key: { created_at: -1 } },
  ],
  product_options: [
    { key: { product_id: 1 } },
  ],
  product_details: [
    { key: { product_id: 1 } },
  ],
}

/**
 * Create all MongoDB indexes for the admin app.
 *
 * Idempotent and safe to call repeatedly (e.g. on every server boot). Each
 * index is created independently so that a conflict on one never prevents the
 * rest from being created. Errors are logged, not thrown.
 *
 * @returns {Promise<void>} Resolves once all index creation attempts complete.
 */
export async function ensureIndexes(): Promise<void> {
  const db = await getDb()

  let created = 0
  let failed = 0

  for (const [collectionName, defs] of Object.entries(INDEXES)) {
    const collection = db.collection(collectionName)
    for (const { key, options } of defs) {
      try {
        await collection.createIndex(key, options)
        created++
      } catch (err) {
        // createIndex is idempotent for identical specs; an "already exists"
        // or options-conflict error must never crash boot.
        failed++
        console.warn(
          `[ensureIndexes] Skipped index on ${collectionName} (${JSON.stringify(key)}): ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      }
    }
  }

  console.log(
    `[ensureIndexes] Index check complete: ${created} ensured, ${failed} skipped/failed.`
  )
}
