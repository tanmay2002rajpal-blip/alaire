/**
 * Create all MongoDB indexes for the admin app.
 * Run with: npx tsx admin/scripts/create-indexes.ts
 */

import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const MONGODB_DB = process.env.MONGODB_DB || 'alaire'

async function createIndexes() {
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db(MONGODB_DB)

  console.log(`Connected to ${MONGODB_DB}. Creating indexes...`)

  // admin_users
  await db.collection('admin_users').createIndexes([
    { key: { email: 1 }, unique: true },
  ])
  console.log('  admin_users indexes created')

  // admin_sessions
  await db.collection('admin_sessions').createIndexes([
    { key: { admin_id: 1 } },
    { key: { token_hash: 1 } },
    { key: { expires_at: 1 }, expireAfterSeconds: 0 }, // TTL index
  ])
  console.log('  admin_sessions indexes created')

  // activity_log
  await db.collection('activity_log').createIndexes([
    { key: { admin_id: 1 } },
    { key: { created_at: -1 } },
    { key: { entity_type: 1, entity_id: 1 } },
  ])
  console.log('  activity_log indexes created')

  // products
  await db.collection('products').createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { category_id: 1 } },
    { key: { is_active: 1 } },
    { key: { created_at: -1 } },
    { key: { name: 'text', description: 'text' } },
  ])
  console.log('  products indexes created')

  // product_variants
  await db.collection('product_variants').createIndexes([
    { key: { product_id: 1 } },
    { key: { sku: 1 }, sparse: true },
    { key: { is_active: 1, stock_quantity: 1 } },
  ])
  console.log('  product_variants indexes created')

  // categories
  await db.collection('categories').createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { parent_id: 1 } },
    { key: { position: 1 } },
  ])
  console.log('  categories indexes created')

  // orders
  await db.collection('orders').createIndexes([
    { key: { order_number: 1 }, unique: true },
    { key: { user_id: 1 } },
    { key: { status: 1 } },
    { key: { created_at: -1 } },
  ])
  console.log('  orders indexes created')

  // order_items
  await db.collection('order_items').createIndexes([
    { key: { order_id: 1 } },
    { key: { product_id: 1 } },
  ])
  console.log('  order_items indexes created')

  // order_status_history
  await db.collection('order_status_history').createIndexes([
    { key: { order_id: 1, created_at: -1 } },
  ])
  console.log('  order_status_history indexes created')

  // users (profiles)
  await db.collection('users').createIndexes([
    { key: { email: 1 }, unique: true, sparse: true },
    { key: { created_at: -1 } },
    { key: { is_active: 1 } },
  ])
  console.log('  users indexes created')

  // addresses
  await db.collection('addresses').createIndexes([
    { key: { user_id: 1 } },
  ])
  console.log('  addresses indexes created')

  // coupons
  await db.collection('coupons').createIndexes([
    { key: { code: 1 }, unique: true },
    { key: { is_active: 1 } },
    { key: { valid_from: 1, valid_until: 1 } },
  ])
  console.log('  coupons indexes created')

  // hero_slides
  await db.collection('hero_slides').createIndexes([
    { key: { position: 1 } },
    { key: { is_active: 1 } },
  ])
  console.log('  hero_slides indexes created')

  // blog_posts
  await db.collection('blog_posts').createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { is_published: 1 } },
    { key: { created_at: -1 } },
  ])
  console.log('  blog_posts indexes created')

  // newsletter_subscribers
  await db.collection('newsletter_subscribers').createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { is_active: 1 } },
  ])
  console.log('  newsletter_subscribers indexes created')

  // wallets
  await db.collection('wallets').createIndexes([
    { key: { user_id: 1 }, unique: true },
  ])
  console.log('  wallets indexes created')

  // wallet_transactions
  await db.collection('wallet_transactions').createIndexes([
    { key: { wallet_id: 1 } },
    { key: { created_at: -1 } },
  ])
  console.log('  wallet_transactions indexes created')

  // product_options
  await db.collection('product_options').createIndexes([
    { key: { product_id: 1 } },
  ])
  console.log('  product_options indexes created')

  // product_details
  await db.collection('product_details').createIndexes([
    { key: { product_id: 1 } },
  ])
  console.log('  product_details indexes created')

  console.log('\nAll indexes created successfully!')
  await client.close()
}

createIndexes().catch(err => {
  console.error('Failed to create indexes:', err)
  process.exit(1)
})
