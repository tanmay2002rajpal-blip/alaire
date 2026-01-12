/**
 * @fileoverview Utility functions for the Alaire e-commerce application.
 * Provides common formatting, transformation, and helper functions.
 *
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================================================
// CSS/Styling Utilities
// ============================================================================

/**
 * Combines class names with Tailwind CSS conflict resolution.
 * Uses clsx for conditional classes and twMerge for deduplication.
 *
 * @param inputs - Class values to combine (strings, objects, arrays)
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn("px-4 py-2", "bg-blue-500") // "px-4 py-2 bg-blue-500"
 *
 * // With conditionals
 * cn("base-class", isActive && "active-class") // Omits falsy values
 *
 * // With Tailwind conflict resolution
 * cn("px-4", "px-8") // "px-8" (later value wins)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// Price/Currency Formatting
// ============================================================================

/**
 * Formats a number as Indian Rupees (INR) currency.
 * Uses Indian number formatting (lakhs/crores) with no decimals.
 *
 * @param price - Amount to format
 * @returns Formatted price string (e.g., "₹1,999")
 *
 * @example
 * ```ts
 * formatPrice(1999) // "₹1,999"
 * formatPrice(100000) // "₹1,00,000" (Indian format with lakhs)
 * formatPrice(0) // "₹0"
 * ```
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Formats a date string or Date object for display.
 * Uses Indian English locale with abbreviated month.
 *
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string (e.g., "25 Dec 2024")
 *
 * @example
 * ```ts
 * formatDate("2024-12-25") // "25 Dec 2024"
 * formatDate(new Date()) // "26 Dec 2024" (today)
 * ```
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

// ============================================================================
// Text Utilities
// ============================================================================

/**
 * Converts text to a URL-friendly slug.
 * Removes special characters, replaces spaces with hyphens.
 *
 * @param text - Text to slugify
 * @returns URL-friendly slug
 *
 * @example
 * ```ts
 * slugify("Hello World") // "hello-world"
 * slugify("Product Name (2024)") // "product-name-2024"
 * slugify("  Extra   Spaces  ") // "extra-spaces"
 * ```
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Truncates text to specified length with ellipsis.
 * Returns original string if shorter than limit.
 *
 * @param str - Text to truncate
 * @param length - Maximum length before truncation
 * @returns Truncated string with "..." suffix
 *
 * @example
 * ```ts
 * truncate("Hello World", 5) // "Hello..."
 * truncate("Hi", 10) // "Hi" (unchanged)
 * ```
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// ============================================================================
// Price Calculation Utilities
// ============================================================================

/**
 * Calculates discount percentage between original and sale price.
 * Returns 0 if no valid discount exists.
 *
 * @param price - Current/sale price
 * @param compareAtPrice - Original/compare at price
 * @returns Discount percentage (0-100), rounded to nearest integer
 *
 * @example
 * ```ts
 * getDiscountPercentage(800, 1000) // 20 (20% off)
 * getDiscountPercentage(1000, 1000) // 0 (no discount)
 * getDiscountPercentage(1000, 500) // 0 (price higher than compare)
 * ```
 */
export function getDiscountPercentage(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

/**
 * Alias for getDiscountPercentage with swapped parameter order.
 * Provided for convenience when working with different data structures.
 *
 * @param compareAtPrice - Original/compare at price
 * @param price - Current/sale price
 * @returns Discount percentage (0-100)
 *
 * @deprecated Use getDiscountPercentage for consistency
 */
export function calculateDiscount(compareAtPrice: number, price: number): number {
  return getDiscountPercentage(price, compareAtPrice)
}

// ============================================================================
// Order Utilities
// ============================================================================

/**
 * Formats order number for display.
 * Converts internal format (ORD-xxx) to display format (#xxx).
 *
 * @param orderNumber - Internal order number
 * @returns Formatted order number for display
 *
 * @example
 * ```ts
 * formatOrderNumber("ORD-12345") // "#12345"
 * formatOrderNumber("12345") // "#12345" (no prefix to remove)
 * ```
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber.replace('ORD-', '#')
}
