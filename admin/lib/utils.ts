import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Indian Rupees
 * Uses manual formatting for consistency across server/client
 */
export function formatPrice(amount: number): string {
  // Manual Indian number system formatting to avoid hydration mismatches
  const absAmount = Math.abs(Math.round(amount))
  const sign = amount < 0 ? '-' : ''

  if (absAmount < 1000) {
    return `${sign}₹${absAmount}`
  }

  // Convert to string and apply Indian number grouping
  const str = absAmount.toString()
  const lastThree = str.slice(-3)
  const remaining = str.slice(0, -3)

  if (remaining.length === 0) {
    return `${sign}₹${lastThree}`
  }

  // Group remaining digits in pairs (Indian system: 1,00,000)
  const groups = []
  let pos = remaining.length
  while (pos > 0) {
    const start = Math.max(0, pos - 2)
    groups.unshift(remaining.slice(start, pos))
    pos = start
  }

  return `${sign}₹${groups.join(',')},${lastThree}`
}

/**
 * Format a number with compact notation (e.g., 1.5L, 10K)
 */
export function formatCompactPrice(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`
  }
  return `₹${amount}`
}
