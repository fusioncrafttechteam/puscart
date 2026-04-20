import { supabase } from './supabase'

export const getProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data
}

export const getCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (error) throw error

  return data
}

export const getProductsByCategory = async (categoryId: string) => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data
}

export const getFeaturedProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq("is_active", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) throw error

  return data
}

export const getProductById = async (productId: string) => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq("id", productId)
    .eq("is_active", true)
    .single()

  if (error) throw error

  return data
}

export const searchProducts = async (query: string) => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data
}

export const getPopularProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq("is_active", true)
    .eq("popular", true)
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) throw error

  return data
}

export const getBestSellingProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq("is_active", true)
    .eq("best_selling", true)
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) throw error

  return data
}

export const getOfferBanners = async () => {
  const { data, error } = await supabase
    .from("offer_banners")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error('Error fetching offer banners:', error)
    return []
  }

  // Transform database data to match OfferBanner component expectations
  return data?.map(banner => ({
    id: banner.id,
    title: banner.title,
    description: banner.description,
    image: banner.image,
    discount: banner.discount || "20%", // Use database discount field or default
    code: banner.code || "OFFER20" // Use database code field or default
  })) || []
}
