/**
 * Seed MongoDB with development data for the admin app.
 * Run with: npx tsx admin/scripts/seed-mongodb.ts
 *
 * This creates:
 * - Admin user (admin@alaire.in / admin123)
 * - Sample categories
 * - Sample products with variants
 * - Sample hero slides
 */

import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI!
const MONGODB_DB = process.env.MONGODB_DB || 'alaire'

async function seed() {
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db(MONGODB_DB)

  console.log(`Connected to ${MONGODB_DB}. Seeding data...`)

  const now = new Date()

  // 1. Admin User
  const adminUsersCol = db.collection('admin_users')
  const existingAdmin = await adminUsersCol.findOne({ email: 'admin@alaire.in' })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 12)
    await adminUsersCol.insertOne({
      _id: new ObjectId(),
      email: 'admin@alaire.in',
      name: 'Admin',
      password_hash: passwordHash,
      role: 'admin',
      is_active: true,
      two_factor_enabled: false,
      created_at: now,
      updated_at: now,
    })
    console.log('  Admin user created: admin@alaire.in / admin123')
  } else {
    console.log('  Admin user already exists, skipping')
  }

  // 2. Categories
  const categoriesCol = db.collection('categories')
  const categoryCount = await categoriesCol.countDocuments()

  const categoryIds: Record<string, ObjectId> = {}

  if (categoryCount === 0) {
    const categories = [
      { name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion', position: 0 },
      { name: 'Accessories', slug: 'accessories', description: 'Fashion accessories', position: 1 },
      { name: 'Footwear', slug: 'footwear', description: 'Shoes and sandals', position: 2 },
    ]

    for (const cat of categories) {
      const id = new ObjectId()
      categoryIds[cat.slug] = id
      await categoriesCol.insertOne({
        _id: id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image_url: null,
        parent_id: null,
        position: cat.position,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
    }
    console.log(`  ${categories.length} categories created`)
  } else {
    console.log('  Categories already exist, skipping')
  }

  // 3. Products with Variants
  const productsCol = db.collection('products')
  const variantsCol = db.collection('product_variants')
  const productCount = await productsCol.countDocuments()

  if (productCount === 0 && Object.keys(categoryIds).length > 0) {
    const products = [
      {
        name: 'Classic Cotton T-Shirt',
        slug: 'classic-cotton-tshirt',
        description: 'A comfortable everyday cotton t-shirt',
        category_id: categoryIds['clothing'],
        base_price: 999,
        images: [],
        has_variants: true,
        variants: [
          { name: 'Small / White', sku: 'CCT-S-WHT', price: 999, stock_quantity: 50, options: { size: 'S', color: 'White' } },
          { name: 'Medium / White', sku: 'CCT-M-WHT', price: 999, stock_quantity: 75, options: { size: 'M', color: 'White' } },
          { name: 'Large / White', sku: 'CCT-L-WHT', price: 999, stock_quantity: 60, options: { size: 'L', color: 'White' } },
          { name: 'Medium / Black', sku: 'CCT-M-BLK', price: 999, stock_quantity: 45, options: { size: 'M', color: 'Black' } },
        ],
      },
      {
        name: 'Leather Belt',
        slug: 'leather-belt',
        description: 'Premium genuine leather belt',
        category_id: categoryIds['accessories'],
        base_price: 1499,
        images: [],
        has_variants: true,
        variants: [
          { name: 'Brown / 32', sku: 'LB-BRN-32', price: 1499, stock_quantity: 30, options: { color: 'Brown', size: '32' } },
          { name: 'Black / 34', sku: 'LB-BLK-34', price: 1499, stock_quantity: 25, options: { color: 'Black', size: '34' } },
        ],
      },
      {
        name: 'Canvas Sneakers',
        slug: 'canvas-sneakers',
        description: 'Casual canvas sneakers for everyday wear',
        category_id: categoryIds['footwear'],
        base_price: 2499,
        images: [],
        has_variants: true,
        variants: [
          { name: 'White / 8', sku: 'CS-WHT-8', price: 2499, stock_quantity: 20, options: { color: 'White', size: '8' } },
          { name: 'White / 9', sku: 'CS-WHT-9', price: 2499, stock_quantity: 5, options: { color: 'White', size: '9' } },
          { name: 'Navy / 10', sku: 'CS-NVY-10', price: 2499, stock_quantity: 0, options: { color: 'Navy', size: '10' } },
        ],
      },
    ]

    for (const product of products) {
      const productId = new ObjectId()
      await productsCol.insertOne({
        _id: productId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        category_id: product.category_id,
        base_price: product.base_price,
        images: product.images,
        has_variants: product.has_variants,
        is_active: true,
        created_at: now,
        updated_at: now,
      })

      if (product.variants.length > 0) {
        await variantsCol.insertMany(
          product.variants.map(v => ({
            _id: new ObjectId(),
            product_id: productId,
            name: v.name,
            sku: v.sku,
            price: v.price,
            compare_at_price: null,
            stock_quantity: v.stock_quantity,
            options: v.options,
            image_url: null,
            is_active: true,
            created_at: now,
            updated_at: now,
          }))
        )
      }
    }
    console.log(`  ${products.length} products with variants created`)
  } else {
    console.log('  Products already exist, skipping')
  }

  // 4. Hero Slides
  const slidesCol = db.collection('hero_slides')
  const slideCount = await slidesCol.countDocuments()

  if (slideCount === 0) {
    await slidesCol.insertMany([
      {
        _id: new ObjectId(),
        title: 'New Arrivals',
        subtitle: 'Spring Collection 2026',
        description: 'Discover our latest collection of premium fashion',
        image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        button_text: 'Shop Now',
        button_link: '/collections/new-arrivals',
        position: 0,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        _id: new ObjectId(),
        title: 'Summer Sale',
        subtitle: 'Up to 50% Off',
        description: 'Limited time offer on selected items',
        image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc',
        button_text: 'View Deals',
        button_link: '/sale',
        position: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ])
    console.log('  2 hero slides created')
  } else {
    console.log('  Hero slides already exist, skipping')
  }

  console.log('\nSeeding complete!')
  await client.close()
}

seed().catch(err => {
  console.error('Failed to seed database:', err)
  process.exit(1)
})
