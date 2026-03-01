import { Collection } from 'mongodb'
import { getDb } from './client'
import type {
  AdminUserDoc,
  AdminSessionDoc,
  ActivityLogDoc,
  ProductDoc,
  ProductVariantDoc,
  CategoryDoc,
  OrderDoc,
  OrderItemDoc,
  OrderStatusHistoryDoc,
  UserDoc,
  AddressDoc,
  CouponDoc,
  HeroSlideDoc,
  BlogPostDoc,
  NewsletterSubscriberDoc,
  WalletDoc,
  WalletTransactionDoc,
  ProductOptionDoc,
  ProductDetailDoc,
} from './types'

export async function getAdminUsersCollection(): Promise<Collection<AdminUserDoc>> {
  const db = await getDb()
  return db.collection<AdminUserDoc>('admin_users')
}

export async function getAdminSessionsCollection(): Promise<Collection<AdminSessionDoc>> {
  const db = await getDb()
  return db.collection<AdminSessionDoc>('admin_sessions')
}

export async function getActivityLogCollection(): Promise<Collection<ActivityLogDoc>> {
  const db = await getDb()
  return db.collection<ActivityLogDoc>('activity_log')
}

export async function getProductsCollection(): Promise<Collection<ProductDoc>> {
  const db = await getDb()
  return db.collection<ProductDoc>('products')
}

export async function getProductVariantsCollection(): Promise<Collection<ProductVariantDoc>> {
  const db = await getDb()
  return db.collection<ProductVariantDoc>('product_variants')
}

export async function getCategoriesCollection(): Promise<Collection<CategoryDoc>> {
  const db = await getDb()
  return db.collection<CategoryDoc>('categories')
}

export async function getOrdersCollection(): Promise<Collection<OrderDoc>> {
  const db = await getDb()
  return db.collection<OrderDoc>('orders')
}

export async function getOrderItemsCollection(): Promise<Collection<OrderItemDoc>> {
  const db = await getDb()
  return db.collection<OrderItemDoc>('order_items')
}

export async function getOrderStatusHistoryCollection(): Promise<Collection<OrderStatusHistoryDoc>> {
  const db = await getDb()
  return db.collection<OrderStatusHistoryDoc>('order_status_history')
}

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb()
  return db.collection<UserDoc>('users')
}

export async function getAddressesCollection(): Promise<Collection<AddressDoc>> {
  const db = await getDb()
  return db.collection<AddressDoc>('addresses')
}

export async function getCouponsCollection(): Promise<Collection<CouponDoc>> {
  const db = await getDb()
  return db.collection<CouponDoc>('coupons')
}

export async function getHeroSlidesCollection(): Promise<Collection<HeroSlideDoc>> {
  const db = await getDb()
  return db.collection<HeroSlideDoc>('hero_slides')
}

export async function getBlogPostsCollection(): Promise<Collection<BlogPostDoc>> {
  const db = await getDb()
  return db.collection<BlogPostDoc>('blog_posts')
}

export async function getNewsletterSubscribersCollection(): Promise<Collection<NewsletterSubscriberDoc>> {
  const db = await getDb()
  return db.collection<NewsletterSubscriberDoc>('newsletter_subscribers')
}

export async function getWalletsCollection(): Promise<Collection<WalletDoc>> {
  const db = await getDb()
  return db.collection<WalletDoc>('wallets')
}

export async function getWalletTransactionsCollection(): Promise<Collection<WalletTransactionDoc>> {
  const db = await getDb()
  return db.collection<WalletTransactionDoc>('wallet_transactions')
}

export async function getProductOptionsCollection(): Promise<Collection<ProductOptionDoc>> {
  const db = await getDb()
  return db.collection<ProductOptionDoc>('product_options')
}

export async function getProductDetailsCollection(): Promise<Collection<ProductDetailDoc>> {
  const db = await getDb()
  return db.collection<ProductDetailDoc>('product_details')
}
