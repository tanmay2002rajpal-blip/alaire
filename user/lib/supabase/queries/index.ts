/**
 * @fileoverview Supabase queries module exports.
 * Re-exports all domain-specific query functions and types.
 *
 * This module has been refactored for better maintainability:
 * - products.ts: Product listings, search, and details
 * - categories.ts: Category navigation and filtering
 * - orders.ts: Order history and details
 * - reviews.ts: Product reviews and ratings
 * - homepage.ts: Homepage content (hero slides, etc.)
 *
 * @module lib/supabase/queries
 *
 * @example
 * ```ts
 * import {
 *   getProducts,
 *   getCategories,
 *   getOrderById,
 *   getProductReviews,
 *   getHeroSlides,
 * } from '@/lib/supabase/queries'
 * ```
 */

// ============================================================================
// Product Queries
// ============================================================================

export {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getRelatedProducts,
  getRecentlyViewed,
} from "./products"

export type {
  ProductWithRelations,
  ProductSortOption,
  GetProductsOptions,
} from "./products"

// ============================================================================
// Category Queries
// ============================================================================

export {
  getCategories,
  getCategoriesWithCounts,
  getCategoryBySlug,
} from "./categories"

export type { CategoryWithCount } from "./categories"

// ============================================================================
// Order Queries
// ============================================================================

export { getOrderById, getUserOrders } from "./orders"

export type {
  OrderWithDetails,
  OrderItem,
  OrderStatusEntry,
} from "./orders"

// ============================================================================
// Review Queries
// ============================================================================

export {
  getProductReviews,
  getReviewSummary,
  canUserReview,
} from "./reviews"

export type { ReviewSummary } from "./reviews"

// ============================================================================
// Homepage Queries
// ============================================================================

export { getHeroSlides, getHomepageStats } from "./homepage"

export type { HeroSlide, HomepageStats } from "./homepage"
