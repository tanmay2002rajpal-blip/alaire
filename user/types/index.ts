// Import and export all types from database.ts
import type { Database } from './database'
export * from './database'
export type { Database, Json } from './database'

// Convenience type aliases for database tables
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Address = Database['public']['Tables']['addresses']['Row']
export type AddressInsert = Database['public']['Tables']['addresses']['Insert']
export type AddressUpdate = Database['public']['Tables']['addresses']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type ProductOption = Database['public']['Tables']['product_options']['Row']
export type ProductOptionInsert = Database['public']['Tables']['product_options']['Insert']
export type ProductOptionUpdate = Database['public']['Tables']['product_options']['Update']

export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type ProductVariantInsert = Database['public']['Tables']['product_variants']['Insert']
export type ProductVariantUpdate = Database['public']['Tables']['product_variants']['Update']

export type ProductDetail = Database['public']['Tables']['product_details']['Row']
export type ProductDetailInsert = Database['public']['Tables']['product_details']['Insert']
export type ProductDetailUpdate = Database['public']['Tables']['product_details']['Update']

export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type CartItemInsert = Database['public']['Tables']['cart_items']['Insert']
export type CartItemUpdate = Database['public']['Tables']['cart_items']['Update']

export type DiscountCode = Database['public']['Tables']['discount_codes']['Row']
export type DiscountCodeInsert = Database['public']['Tables']['discount_codes']['Insert']
export type DiscountCodeUpdate = Database['public']['Tables']['discount_codes']['Update']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

export type OrderStatusHistory = Database['public']['Tables']['order_status_history']['Row']
export type OrderStatusHistoryInsert = Database['public']['Tables']['order_status_history']['Insert']
export type OrderStatusHistoryUpdate = Database['public']['Tables']['order_status_history']['Update']

export type Wishlist = Database['public']['Tables']['wishlists']['Row']
export type WishlistInsert = Database['public']['Tables']['wishlists']['Insert']
export type WishlistUpdate = Database['public']['Tables']['wishlists']['Update']

export type Review = Database['public']['Tables']['reviews']['Row']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export type Wallet = Database['public']['Tables']['wallets']['Row']
export type WalletInsert = Database['public']['Tables']['wallets']['Insert']
export type WalletUpdate = Database['public']['Tables']['wallets']['Update']

export type WalletTransaction = Database['public']['Tables']['wallet_transactions']['Row']
export type WalletTransactionInsert = Database['public']['Tables']['wallet_transactions']['Insert']
export type WalletTransactionUpdate = Database['public']['Tables']['wallet_transactions']['Update']

export type RecentlyViewed = Database['public']['Tables']['recently_viewed']['Row']
export type RecentlyViewedInsert = Database['public']['Tables']['recently_viewed']['Insert']
export type RecentlyViewedUpdate = Database['public']['Tables']['recently_viewed']['Update']

export type RelatedProduct = Database['public']['Tables']['related_products']['Row']
export type RelatedProductInsert = Database['public']['Tables']['related_products']['Insert']
export type RelatedProductUpdate = Database['public']['Tables']['related_products']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']
export type NewsletterSubscriberInsert = Database['public']['Tables']['newsletter_subscribers']['Insert']
export type NewsletterSubscriberUpdate = Database['public']['Tables']['newsletter_subscribers']['Update']

export type BlogPost = Database['public']['Tables']['blog_posts']['Row']
export type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert']
export type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update']

export type StoreSetting = Database['public']['Tables']['store_settings']['Row']
export type StoreSettingInsert = Database['public']['Tables']['store_settings']['Insert']
export type StoreSettingUpdate = Database['public']['Tables']['store_settings']['Update']

// Composite types for common use cases
export interface ProductWithDetails extends Product {
  category?: Category | null
  variants?: ProductVariant[]
  options?: ProductOption[]
  details?: ProductDetail[]
  related_products?: Product[]
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
  options: ProductOption[]
}

export interface CartItemWithProduct extends CartItem {
  product: Product
  variant?: ProductVariant | null
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  status_history?: OrderStatusHistory[]
}

export interface OrderItemWithDetails extends OrderItem {
  product?: Product | null
  variant?: ProductVariant | null
}

export interface ReviewWithUser extends Review {
  user: Profile
}

export interface WishlistWithProduct extends Wishlist {
  product: Product
}

export interface CategoryWithParent extends Category {
  parent?: Category | null
  children?: Category[]
}

export interface CategoryWithProducts extends Category {
  products?: Product[]
}

export interface WalletWithTransactions extends Wallet {
  transactions: WalletTransaction[]
}

export interface BlogPostWithAuthor extends BlogPost {
  author?: Profile | null
}

// Type for shipping address JSON
export interface ShippingAddress {
  full_name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

// Type for variant options JSON
export interface VariantOptions {
  [key: string]: string
}

// Order status enum
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

// Discount code type enum
export type DiscountType = 'percentage' | 'fixed'

// Wallet transaction type enum
export type WalletTransactionType = 'credit' | 'debit'
