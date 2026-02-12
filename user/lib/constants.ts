/**
 * @fileoverview Application-wide constants and configuration.
 * Centralizes all static values used across the application.
 *
 * @module lib/constants
 */

/** Store/brand name used across the application */
export const STORE_NAME = "Alaire"

/**
 * List of all Indian states and union territories.
 * Used for address forms and shipping calculations.
 */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const

export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
} as const

export const NAV_LINKS = [
  { href: '/products?filter=sale', label: 'Sale' },
  { href: '/categories', label: 'Collection' },
  { href: '/blog', label: 'Blogs' },
] as const

export const FOOTER_LINKS = {
  shop: [
    { href: '/products?filter=sale', label: 'Sale' },
    { href: '/categories', label: 'Collection' },
    { href: '/blog', label: 'Blogs' },
  ],
  account: [
    { href: '/account', label: 'My Account' },
    { href: '/account/orders', label: 'Orders' },
    { href: '/account/wishlist', label: 'Wishlist' },
    { href: '/account/wallet', label: 'Wallet' },
  ],
  help: [
    { href: '/contact', label: 'Contact Us' },
    { href: '/shipping', label: 'Shipping Info' },
    { href: '/returns', label: 'Returns & Exchanges' },
    { href: '/faq', label: 'FAQ' },
  ],
} as const

export const PAYMENT_METHODS = ['visa', 'mastercard', 'upi', 'razorpay'] as const

export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/alaire.official',
  facebook: 'https://facebook.com/alaire.official',
  twitter: 'https://twitter.com/alaire_official',
} as const

export const SITE_CONFIG = {
  name: STORE_NAME,
  description: 'Curated collection of premium products for the modern lifestyle.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const
