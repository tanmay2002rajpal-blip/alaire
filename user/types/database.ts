export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          full_name: string
          phone: string
          line1: string
          line2: string | null
          city: string
          state: string
          pincode: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          full_name: string
          phone: string
          line1: string
          line2?: string | null
          city: string
          state: string
          pincode: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          full_name?: string
          phone?: string
          line1?: string
          line2?: string | null
          city?: string
          state?: string
          pincode?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          position: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string | null
          images: string[]
          has_variants: boolean
          base_price: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category_id?: string | null
          images?: string[]
          has_variants?: boolean
          base_price?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category_id?: string | null
          images?: string[]
          has_variants?: boolean
          base_price?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_options: {
        Row: {
          id: string
          product_id: string
          name: string
          values: string[]
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          values?: string[]
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          values?: string[]
          position?: number
          created_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string | null
          price: number
          compare_at_price: number | null
          stock_quantity: number
          options: Json
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          sku?: string | null
          price: number
          compare_at_price?: number | null
          stock_quantity?: number
          options?: Json
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          sku?: string | null
          price?: number
          compare_at_price?: number | null
          stock_quantity?: number
          options?: Json
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_details: {
        Row: {
          id: string
          product_id: string
          tab_name: string
          content: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          tab_name: string
          content?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          tab_name?: string
          content?: string | null
          position?: number
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          variant_id?: string | null
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          variant_id?: string | null
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      discount_codes: {
        Row: {
          id: string
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount: number
          max_discount_amount: number | null
          max_uses: number | null
          current_uses: number
          valid_from: string
          valid_until: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount?: number
          max_discount_amount?: number | null
          max_uses?: number | null
          current_uses?: number
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: 'percentage' | 'fixed'
          value?: number
          min_order_amount?: number
          max_discount_amount?: number | null
          max_uses?: number | null
          current_uses?: number
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          subtotal: number
          discount_amount: number
          shipping_cost: number
          total: number
          shipping_address: Json
          discount_code_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          wallet_amount_used: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          subtotal: number
          discount_amount?: number
          shipping_cost?: number
          total: number
          shipping_address: Json
          discount_code_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          wallet_amount_used?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          subtotal?: number
          discount_amount?: number
          shipping_cost?: number
          total?: number
          shipping_address?: Json
          discount_code_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          wallet_amount_used?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          product_name: string
          variant_name: string | null
          quantity: number
          price_at_purchase: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          variant_id?: string | null
          product_name: string
          variant_name?: string | null
          quantity: number
          price_at_purchase: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          variant_id?: string | null
          product_name?: string
          variant_name?: string | null
          quantity?: number
          price_at_purchase?: number
          image_url?: string | null
          created_at?: string
        }
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          note: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          order_id: string
          status: string
          note?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          status?: string
          note?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          product_id: string
          rating: number
          title: string | null
          content: string | null
          is_verified_purchase: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          rating: number
          title?: string | null
          content?: string | null
          is_verified_purchase?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          rating?: number
          title?: string | null
          content?: string | null
          is_verified_purchase?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          updated_at?: string
        }
      }
      wallet_transactions: {
        Row: {
          id: string
          wallet_id: string
          type: 'credit' | 'debit'
          amount: number
          description: string | null
          reference_type: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          type: 'credit' | 'debit'
          amount: number
          description?: string | null
          reference_type?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          type?: 'credit' | 'debit'
          amount?: number
          description?: string | null
          reference_type?: string | null
          reference_id?: string | null
          created_at?: string
        }
      }
      recently_viewed: {
        Row: {
          id: string
          user_id: string
          product_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          viewed_at?: string
        }
      }
      related_products: {
        Row: {
          product_id: string
          related_product_id: string
          created_at: string
        }
        Insert: {
          product_id: string
          related_product_id: string
          created_at?: string
        }
        Update: {
          product_id?: string
          related_product_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          is_active: boolean
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          id?: string
          email: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          featured_image: string | null
          author_id: string | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          featured_image?: string | null
          author_id?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          featured_image?: string | null
          author_id?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          flat_shipping_rate: number
          free_shipping_threshold: number
          instagram_username: string | null
          loyalty_points_per_rupee: number
          updated_at: string
        }
        Insert: {
          id?: string
          flat_shipping_rate?: number
          free_shipping_threshold?: number
          instagram_username?: string | null
          loyalty_points_per_rupee?: number
          updated_at?: string
        }
        Update: {
          id?: string
          flat_shipping_rate?: number
          free_shipping_threshold?: number
          instagram_username?: string | null
          loyalty_points_per_rupee?: number
          updated_at?: string
        }
      }
    }
  }
}
