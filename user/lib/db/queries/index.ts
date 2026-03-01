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
