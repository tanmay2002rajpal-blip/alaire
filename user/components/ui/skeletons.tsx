/**
 * @fileoverview Skeleton loading components for the Alaire e-commerce site.
 * Provides consistent loading states across the application.
 *
 * Usage:
 * - Use specific skeletons (ProductCardSkeleton, etc.) for page layouts
 * - Use generic Skeleton component for custom loading states
 *
 * @module components/ui/skeletons
 *
 * @example
 * ```tsx
 * import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeletons"
 *
 * // Use pre-built skeleton
 * <ProductGridSkeleton count={8} />
 *
 * // Or build custom
 * <div className="space-y-2">
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-4 w-3/4" />
 * </div>
 * ```
 */

import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

interface SkeletonProps {
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// Base Skeleton
// ============================================================================

/**
 * Generic skeleton primitive for custom loading states.
 * Applies pulse animation and muted background.
 *
 * @param props - Component props
 * @returns Animated skeleton div
 *
 * @example
 * ```tsx
 * <Skeleton className="h-10 w-full rounded-lg" />
 * ```
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  )
}

// ============================================================================
// Product Skeletons
// ============================================================================

/**
 * Skeleton for a single product card.
 * Matches the layout of ProductCard component.
 *
 * @param props - Component props
 * @returns Product card skeleton
 */
export function ProductCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="aspect-[3/4] w-full rounded-lg bg-muted" />
      <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-4 w-1/4 rounded bg-muted" />
    </div>
  )
}

/**
 * Skeleton for a grid of product cards.
 * Responsive layout matching the products page.
 *
 * @param props - Component props with optional count
 * @returns Grid of product card skeletons
 *
 * @example
 * ```tsx
 * <ProductGridSkeleton count={12} />
 * ```
 */
export function ProductGridSkeleton({
  count = 8,
  className
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for product detail page.
 * Includes image gallery, details, and variant selectors.
 *
 * @param props - Component props
 * @returns Full product detail skeleton
 */
export function ProductDetailSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse lg:grid lg:grid-cols-2 lg:gap-12", className)}>
      {/* Left side - Images */}
      <div className="space-y-4">
        {/* Main image */}
        <div className="aspect-square w-full rounded-lg bg-muted" />

        {/* Thumbnail placeholders */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-md bg-muted" />
          ))}
        </div>
      </div>

      {/* Right side - Content */}
      <div className="mt-8 lg:mt-0 space-y-6">
        {/* Title */}
        <div className="space-y-3">
          <div className="h-8 w-3/4 rounded bg-muted" />
          <div className="h-8 w-1/2 rounded bg-muted" />
        </div>

        {/* Price */}
        <div className="h-6 w-1/4 rounded bg-muted" />

        {/* Description lines */}
        <div className="space-y-2 pt-4">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-4/5 rounded bg-muted" />
        </div>

        {/* Size selector placeholder */}
        <div className="space-y-3 pt-4">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-12 rounded-md bg-muted" />
            ))}
          </div>
        </div>

        {/* Button */}
        <div className="h-12 w-full rounded-lg bg-muted" />

        {/* Additional info lines */}
        <div className="space-y-2 pt-6">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Cart Skeletons
// ============================================================================

/**
 * Skeleton for a cart item row.
 * Matches the cart page item layout.
 *
 * @param props - Component props
 * @returns Cart item skeleton
 */
export function CartItemSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse flex gap-4", className)}>
      {/* Image */}
      <div className="h-24 w-20 rounded-md bg-muted flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 space-y-3">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/4 rounded bg-muted" />
        <div className="flex items-center gap-4">
          <div className="h-8 w-24 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
      </div>

      {/* Remove button area */}
      <div className="h-8 w-8 rounded bg-muted flex-shrink-0" />
    </div>
  )
}

// ============================================================================
// Order Skeletons
// ============================================================================

/**
 * Skeleton for an order card in account/orders list.
 * Includes order header, items preview, and action button.
 *
 * @param props - Component props
 * @returns Order card skeleton
 */
export function OrderCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-lg border p-6 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
        <div className="h-6 w-20 rounded-full bg-muted" />
      </div>

      {/* Content lines */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-4 w-1/4 rounded bg-muted" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-2/5 rounded bg-muted" />
          <div className="h-4 w-1/5 rounded bg-muted" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-1/4 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
        </div>
      </div>

      {/* Button */}
      <div className="h-10 w-full rounded-md bg-muted mt-4" />
    </div>
  )
}

// ============================================================================
// Account Skeletons
// ============================================================================

/**
 * Skeleton for generic account section.
 * Used for settings, addresses, etc.
 *
 * @param props - Component props
 * @returns Account section skeleton
 */
export function AccountSectionSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-6", className)}>
      {/* Header */}
      <div className="h-7 w-48 rounded bg-muted" />

      {/* Content rows */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="h-5 w-1/3 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Hero/Banner Skeletons
// ============================================================================

/**
 * Skeleton for hero carousel slide.
 * Full-width with centered content area.
 *
 * @param props - Component props
 * @returns Hero slide skeleton
 */
export function HeroSlideSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("relative h-[80vh] min-h-[600px] w-full animate-pulse bg-muted", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-12 w-40 mx-auto mt-4" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Review Skeletons
// ============================================================================

/**
 * Skeleton for a product review card.
 * Includes rating, content, and author.
 *
 * @param props - Component props
 * @returns Review card skeleton
 */
export function ReviewCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-4 p-4 border rounded-lg", className)}>
      {/* Header with avatar and rating */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Star rating */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-4" />
        ))}
      </div>

      {/* Review content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Date */}
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

// ============================================================================
// Blog Skeletons
// ============================================================================

/**
 * Skeleton for a blog post card.
 * Includes image, title, excerpt, and metadata.
 *
 * @param props - Component props
 * @returns Blog post card skeleton
 */
export function BlogCardSkeleton({ className }: SkeletonProps) {
  return (
    <article className={cn("animate-pulse", className)}>
      {/* Featured image */}
      <Skeleton className="aspect-[16/10] w-full rounded-lg mb-4" />

      {/* Category & date */}
      <div className="flex items-center gap-4 mb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-3" />

      {/* Excerpt */}
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3" />
    </article>
  )
}

// ============================================================================
// Address Skeletons
// ============================================================================

/**
 * Skeleton for a saved address card.
 *
 * @param props - Component props
 * @returns Address card skeleton
 */
export function AddressCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-lg border p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}
