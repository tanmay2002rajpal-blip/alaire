/**
 * Create all MongoDB indexes for the admin app.
 *
 * The index logic now lives in the importable, idempotent `ensureIndexes()`
 * function (see admin/lib/db/ensure-indexes.ts), which is also called
 * automatically at server boot via instrumentation.ts. This script is a thin
 * runnable wrapper kept for manual use.
 *
 * Run with: npx tsx admin/scripts/create-indexes.ts
 *   or:      npm run db:indexes
 */

import { ensureIndexes } from '../lib/db/ensure-indexes'

ensureIndexes()
  .then(() => {
    console.log('\nAll indexes created successfully!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Failed to create indexes:', err)
    process.exit(1)
  })
