import type { ObjectId } from "mongodb"

export interface MongoDocument {
  _id: ObjectId
  created_at?: string
  updated_at?: string
}

export interface ProductDocument extends MongoDocument {
  name: string
  slug: string
  description: string | null
  base_price: number
  images: string[]
  category_id: string | null
  is_active: boolean
  stock_quantity?: number
}

export interface CategoryDocument extends MongoDocument {
  name: string
  slug: string
  description: string | null
  image_url: string | null
  position: number
  is_active: boolean
  parent_id: string | null
}

export interface ProductVariantDocument extends MongoDocument {
  product_id: string
  name: string
  price: number
  stock_quantity: number
  sku: string | null
  options: Record<string, string>
}

export interface OrderDocument extends MongoDocument {
  order_number: string
  user_id: string | null
  email: string
  status: string
  subtotal: number
  discount_amount: number
  discount_code_id: string | null
  shipping_amount: number
  shipping_cost: number
  wallet_amount_used: number
  total: number
  shipping_address: ShippingAddressDocument
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  payment_method: "prepaid" | "cod"
  paid_at: string | null
  bluedart_waybill: string | null
  awb_number: string | null
  courier_name: string | null
}

export interface ShippingAddressDocument {
  full_name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

export interface OrderItemDocument extends MongoDocument {
  order_id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  price: number
  price_at_purchase: number
  image_url: string | null
}

export interface ReviewDocument extends MongoDocument {
  user_id: string
  product_id: string
  rating: number
  title: string | null
  content: string
  is_approved: boolean
  is_verified_purchase: boolean
}

export interface UserDocument extends MongoDocument {
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  email: string | null
}

export interface HeroSlideDocument extends MongoDocument {
  title: string
  subtitle: string | null
  description: string | null
  image_url: string
  button_text: string | null
  button_link: string | null
  position: number
  is_active: boolean
}
