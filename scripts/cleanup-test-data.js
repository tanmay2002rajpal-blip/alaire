#!/usr/bin/env node
/**
 * Cleanup script: removes test/socks categories and their products.
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." MONGODB_DB="alaire" node scripts/cleanup-test-data.js
 *
 * Or with .env.local:
 *   node -e "require('dotenv').config({path:'admin/.env.local'})" -e "" && node scripts/cleanup-test-data.js
 */

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'alaire'

if (!MONGODB_URI) {
  console.error('ERROR: Set MONGODB_URI env var')
  console.error('Usage: MONGODB_URI="mongodb+srv://..." node scripts/cleanup-test-data.js')
  process.exit(1)
}

const CATEGORIES_TO_DELETE = ['socks', 'test']

async function main() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db(MONGODB_DB)
    const categories = db.collection('categories')
    const products = db.collection('products')
    const variants = db.collection('product_variants')

    // Find categories to delete (case-insensitive match on name or slug)
    const categoriesToDelete = await categories.find({
      $or: CATEGORIES_TO_DELETE.flatMap(name => [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { slug: { $regex: new RegExp(`^${name}$`, 'i') } },
      ])
    }).toArray()

    if (categoriesToDelete.length === 0) {
      console.log('No socks/test categories found. Already clean.')
    } else {
      console.log(`\nFound ${categoriesToDelete.length} categories to delete:`)
      categoriesToDelete.forEach(c => console.log(`  - ${c.name} (${c._id})`))

      const categoryIds = categoriesToDelete.map(c => c._id)

      // Find products in these categories
      const productsToDelete = await products.find({
        category_id: { $in: categoryIds }
      }).toArray()

      console.log(`\nFound ${productsToDelete.length} products in these categories`)

      if (productsToDelete.length > 0) {
        const productIds = productsToDelete.map(p => p._id)

        // Delete variants for these products
        const variantResult = await variants.deleteMany({
          product_id: { $in: productIds }
        })
        console.log(`Deleted ${variantResult.deletedCount} variants`)

        // Delete products
        const productResult = await products.deleteMany({
          _id: { $in: productIds }
        })
        console.log(`Deleted ${productResult.deletedCount} products`)
      }

      // Delete categories
      const categoryResult = await categories.deleteMany({
        _id: { $in: categoryIds }
      })
      console.log(`Deleted ${categoryResult.deletedCount} categories`)
    }

    // Show remaining categories
    const remaining = await categories.find({}).toArray()
    console.log(`\nRemaining categories:`)
    remaining.forEach(c => console.log(`  - ${c.name} (slug: ${c.slug})`))

    // Show remaining products
    const remainingProducts = await products.find({}).toArray()
    console.log(`\nRemaining products: ${remainingProducts.length}`)
    remainingProducts.forEach(p => console.log(`  - ${p.name} (active: ${p.is_active})`))

    console.log('\nCleanup complete.')
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

main()
