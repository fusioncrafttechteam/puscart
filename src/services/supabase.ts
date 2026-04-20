import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Anon Key length:", supabaseAnonKey?.length || 0)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables:")
  console.error("VITE_SUPABASE_URL:", !!supabaseUrl)
  console.error("VITE_SUPABASE_ANON_KEY:", !!supabaseAnonKey)
  throw new Error('Missing Supabase environment variables')
}

// Check if the anon key looks valid (should be much longer than just a prefix)
if (supabaseAnonKey.length < 100) {
  console.error("Supabase anon key appears to be incomplete or invalid")
  console.error("Key length:", supabaseAnonKey.length)
  console.error("Key starts with:", supabaseAnonKey.substring(0, 20) + "...")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Re-export types from database types file
export type { 
  User, 
  Category, 
  Product, 
  Order, 
  OrderItem, 
  OfferBanner 
} from '../types/database'
