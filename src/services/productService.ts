import { supabase } from './supabase'
import type { Category, ProductWithCategory } from '../types'

const CACHE_TTL_MS = 60_000

type CacheEntry<T> = { at: number; data: T }

const memoryCache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

async function withCache<T>(key: string, loader: () => Promise<T>, ttl = CACHE_TTL_MS): Promise<T> {
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined
  if (cached && Date.now() - cached.at < ttl) {
    return cached.data
  }

  const pending = inflight.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const request = loader()
    .then((data) => {
      memoryCache.set(key, { at: Date.now(), data })
      inflight.delete(key)
      return data
    })
    .catch((error) => {
      inflight.delete(key)
      throw error
    })

  inflight.set(key, request)
  return request
}

const PRODUCT_SELECT = `
  *,
  categories (
    id,
    name
  )
`

type CatalogProduct = ProductWithCategory & {
  featured?: boolean
  popular?: boolean
  best_selling?: boolean
}

export interface HomepageCatalog {
  featured: ProductWithCategory[]
  popular: ProductWithCategory[]
  bestSelling: ProductWithCategory[]
  categories: Category[]
  offers: Array<{
    id: string
    title: string
    description: string
    image: string
    discount: string
    code: string
  }>
}

export const getProducts = async () => {
  return withCache('products', async () => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data ?? []) as ProductWithCategory[]
  })
}

export const getCategories = async () => {
  return withCache('categories', async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) throw error
    return (data ?? []) as Category[]
  })
}

export const getProductsByCategory = async (categoryId: string) => {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as ProductWithCategory[]
}

export const getFeaturedProducts = async () => {
  const catalog = await getHomepageCatalog()
  return catalog.featured
}

export const getProductById = async (productId: string) => {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .eq("is_active", true)
    .single()

  if (error) throw error
  return data as ProductWithCategory
}

export const searchProducts = async (query: string) => {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as ProductWithCategory[]
}

export const getPopularProducts = async () => {
  const catalog = await getHomepageCatalog()
  return catalog.popular
}

export const getBestSellingProducts = async () => {
  const catalog = await getHomepageCatalog()
  return catalog.bestSelling
}

export const getOfferBanners = async () => {
  return withCache('offer-banners', async () => {
    const { data, error } = await supabase
      .from("offer_banners")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error('Error fetching offer banners:', error)
      return []
    }

    return data?.map(banner => ({
      id: banner.id,
      title: banner.title,
      description: banner.description,
      image: banner.image,
      discount: banner.discount || "20%",
      code: banner.code || "OFFER20"
    })) || []
  })
}

export const getHomepageCatalog = async (): Promise<HomepageCatalog> => {
  return withCache('homepage-catalog', async () => {
    const [productResult, categories, offers] = await Promise.all([
      supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .or('featured.eq.true,popular.eq.true,best_selling.eq.true')
        .order("created_at", { ascending: false }),
      getCategories(),
      getOfferBanners(),
    ])

    if (productResult.error) throw productResult.error

    const rows = (productResult.data ?? []) as CatalogProduct[]

    return {
      featured: rows.filter(product => product.featured).slice(0, 8),
      popular: rows.filter(product => product.popular).slice(0, 8),
      bestSelling: rows.filter(product => product.best_selling).slice(0, 8),
      categories,
      offers,
    }
  })
}
