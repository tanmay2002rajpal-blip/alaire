import { getDb } from "./client"

export async function getCollection(name: string) {
  const db = await getDb()
  return db.collection(name)
}

export async function getProductsCollection() {
  return getCollection("products")
}

export async function getCategoriesCollection() {
  return getCollection("categories")
}

export async function getOrdersCollection() {
  return getCollection("orders")
}

export async function getOrderItemsCollection() {
  return getCollection("order_items")
}

export async function getOrderStatusHistoryCollection() {
  return getCollection("order_status_history")
}

export async function getReviewsCollection() {
  return getCollection("reviews")
}

export async function getUsersCollection() {
  return getCollection("users")
}

export async function getProductVariantsCollection() {
  return getCollection("product_variants")
}

export async function getProductOptionsCollection() {
  return getCollection("product_options")
}

export async function getProductDetailsCollection() {
  return getCollection("product_details")
}

export async function getWishlistsCollection() {
  return getCollection("wishlists")
}

export async function getUserAddressesCollection() {
  return getCollection("user_addresses")
}

export async function getWalletsCollection() {
  return getCollection("wallets")
}

export async function getWalletTransactionsCollection() {
  return getCollection("wallet_transactions")
}

export async function getDiscountCodesCollection() {
  return getCollection("discount_codes")
}

export async function getRecentlyViewedCollection() {
  return getCollection("recently_viewed")
}

export async function getRelatedProductsCollection() {
  return getCollection("related_products")
}

export async function getHeroSlidesCollection() {
  return getCollection("hero_slides")
}

export async function getNotificationsCollection() {
  return getCollection("notifications")
}

export async function getNewsletterSubscribersCollection() {
  return getCollection("newsletter_subscribers")
}

export async function getBlogPostsCollection() {
  return getCollection("blog_posts")
}

export async function getReturnRequestsCollection() {
  return getCollection("return_requests")
}
