import { ObjectId } from 'mongodb'

// Admin
export interface AdminUserDoc {
  _id: ObjectId
  email: string
  name: string
  password_hash: string
  role: 'admin' | 'staff'
  is_active: boolean
  two_factor_enabled: boolean
  created_at: Date
  updated_at: Date
}

export interface AdminSessionDoc {
  _id: ObjectId
  admin_id: ObjectId
  token_hash: string
  expires_at: Date
  created_at: Date
}

export interface ActivityLogDoc {
  _id: ObjectId
  admin_id: ObjectId | null
  admin_name: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, any> | null
  created_at: Date
}

// Products
export interface ProductDoc {
  _id: ObjectId
  name: string
  slug: string
  description: string | null
  category_id: ObjectId | null
  base_price: number | null
  images: string[]
  has_variants: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface ProductVariantDoc {
  _id: ObjectId
  product_id: ObjectId
  name: string
  sku: string | null
  price: number
  compare_at_price: number | null
  stock_quantity: number
  options: any
  image_url: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

// Categories
export interface CategoryDoc {
  _id: ObjectId
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: ObjectId | null
  position: number
  created_at: Date
  updated_at: Date
}

// Orders
export interface OrderDoc {
  _id: ObjectId
  order_number: string
  user_id: ObjectId
  total: number
  subtotal: number
  discount_amount: number
  shipping_cost: number
  status: string
  payment_method: string | null
  shipping_address: any
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  created_at: Date
  updated_at: Date
}

export interface OrderItemDoc {
  _id: ObjectId
  order_id: ObjectId
  product_id: ObjectId | null
  variant_id: ObjectId | null
  quantity: number
  price_at_purchase: number
  product_name: string
  variant_name: string | null
  image_url: string | null
}

export interface OrderStatusHistoryDoc {
  _id: ObjectId
  order_id: ObjectId
  status: string
  note: string | null
  created_by: ObjectId | null
  created_at: Date
}

// Users (profiles in Supabase)
export interface UserDoc {
  _id: ObjectId
  email: string | null
  full_name: string | null
  phone: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface AddressDoc {
  _id: ObjectId
  user_id: ObjectId
  type: 'billing' | 'shipping'
  full_name: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  phone: string | null
  is_default: boolean
}

// Coupons
export interface CouponDoc {
  _id: ObjectId
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount: number | null
  max_discount: number | null
  usage_limit: number | null
  usage_count: number
  valid_from: Date
  valid_until: Date | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

// Hero Slides
export interface HeroSlideDoc {
  _id: ObjectId
  title: string
  subtitle: string | null
  description: string | null
  image_url: string
  button_text: string | null
  button_link: string | null
  position: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

// Blog Posts
export interface BlogPostDoc {
  _id: ObjectId
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image: string | null
  author_id: ObjectId | null
  is_published: boolean
  published_at: Date | null
  created_at: Date
  updated_at: Date
}

// Newsletter
export interface NewsletterSubscriberDoc {
  _id: ObjectId
  email: string
  is_active: boolean
  subscribed_at: Date
  unsubscribed_at: Date | null
}

// Wallets
export interface WalletDoc {
  _id: ObjectId
  user_id: ObjectId
  balance: number
  created_at: Date
  updated_at: Date
}

export interface WalletTransactionDoc {
  _id: ObjectId
  wallet_id: ObjectId
  amount: number
  type: 'credit' | 'debit'
  description: string | null
  reference_id: string | null
  created_at: Date
}

// Product extras
export interface ProductOptionDoc {
  _id: ObjectId
  product_id: ObjectId
  name: string
  values: string[]
  position: number
}

export interface ProductDetailDoc {
  _id: ObjectId
  product_id: ObjectId
  key: string
  value: string
  position: number
}
