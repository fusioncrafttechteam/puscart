/**
 * Recently Viewed Products Hook
 * Tracks and retrieves recently viewed products
 */

import { useState, useEffect } from 'react'

interface RecentlyViewedProduct {
  id: string
  name: string
  image: string
  price: number
  offer_price?: number
  viewed_at: number
}

const STORAGE_KEY = 'puscart_recently_viewed'
const MAX_ITEMS = 20

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([])

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRecentlyViewed(JSON.parse(stored))
      }
    } catch (error) {
      // Silently handle error
    }
  }, [])

  /**
   * Add a product to recently viewed
   */
  const addRecentlyViewed = (product: {
    id: string
    name: string
    image: string
    price: number
    offer_price?: number
  }) => {
    const newEntry: RecentlyViewedProduct = {
      ...product,
      viewed_at: Date.now()
    }

    setRecentlyViewed(prev => {
      // Remove if already exists (to move to top)
      const filtered = prev.filter(item => item.id !== product.id)
      
      // Add new entry at the beginning
      const updated = [newEntry, ...filtered]
      
      // Keep only MAX_ITEMS
      const limited = updated.slice(0, MAX_ITEMS)
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
      } catch (error) {
        // Silently handle error
      }
      
      return limited
    })
  }

  /**
   * Clear recently viewed
   */
  const clearRecentlyViewed = () => {
    setRecentlyViewed([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Get recently viewed excluding a specific product
   */
  const getRecentlyViewedExcluding = (excludeId: string): RecentlyViewedProduct[] => {
    return recentlyViewed.filter(item => item.id !== excludeId)
  }

  return {
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
    getRecentlyViewedExcluding
  }
}
