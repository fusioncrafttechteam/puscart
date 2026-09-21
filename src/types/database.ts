export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          role: 'user' | 'admin'
          profile_image: string | null
          is_blocked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          role?: 'user' | 'admin'
          profile_image?: string | null
          is_blocked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          role?: 'user' | 'admin'
          profile_image?: string | null
          is_blocked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string
          image: string
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          image: string
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image?: string
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          category_id: string
          price: number
          offer_price: number | null
          stock: number
          image: string
          is_active: boolean
          popular: boolean
          featured: boolean
          best_selling: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category_id: string
          price: number
          offer_price?: number | null
          stock: number
          image: string
          is_active?: boolean
          popular?: boolean
          featured?: boolean
          best_selling?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category_id?: string
          price?: number
          offer_price?: number | null
          stock?: number
          image?: string
          is_active?: boolean
          popular?: boolean
          featured?: boolean
          best_selling?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          delivery_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          delivery_address: string
          phone: string
          delivery_address_id?: string
          products: ProductItem[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          delivery_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          delivery_address: string
          phone: string
          delivery_address_id?: string
          products: ProductItem[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          delivery_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          delivery_address?: string
          phone?: string
          delivery_address_id?: string
          products?: ProductItem[]
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      offer_banners: {
        Row: {
          id: string
          title: string
          description: string
          image: string
          discount: string
          code: string
          is_active: boolean
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image: string
          discount?: string
          code?: string
          is_active?: boolean
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image?: string
          discount?: string
          code?: string
          is_active?: boolean
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export interface ProductItem {
  id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
  products?: {
    id: string
    name: string
    image: string
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type OfferBanner = Database['public']['Tables']['offer_banners']['Row']
