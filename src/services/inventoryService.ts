/**
 * Inventory Service
 * Handles inventory monitoring and stock alerts
 */

import { supabase } from './supabase'
import { logger } from './loggingService'

export interface LowStockProduct {
  id: string
  name: string
  stock: number
  threshold: number
  category_name?: string
}

export interface InventoryAlert {
  id: string
  product_id: string
  product_name: string
  alert_type: 'low_stock' | 'out_of_stock'
  stock: number
  threshold: number
  created_at: string
  resolved: boolean
}

/**
 * Get products with low stock
 */
export const getLowStockProducts = async (threshold: number = 10): Promise<LowStockProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        stock,
        categories (
          name
        )
      `)
      .eq('is_active', true)
      .lt('stock', threshold)
      .order('stock', { ascending: true })

    if (error) throw error

    return (data || []).map(product => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      threshold,
      category_name: (product.categories as any)?.name
    }))
  } catch (error) {
    logger.error('Failed to fetch low stock products', { error, threshold })
    return []
  }
}

/**
 * Get out of stock products
 */
export const getOutOfStockProducts = async (): Promise<LowStockProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        stock,
        categories (
          name
        )
      `)
      .eq('is_active', true)
      .eq('stock', 0)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(product => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      threshold: 0,
      category_name: (product.categories as any)?.name
    }))
  } catch (error) {
    logger.error('Failed to fetch out of stock products', { error })
    return []
  }
}

/**
 * Create inventory alert
 */
export const createInventoryAlert = async (
  productId: string,
  productName: string,
  alertType: 'low_stock' | 'out_of_stock',
  stock: number,
  threshold: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inventory_alerts')
      .insert({
        product_id: productId,
        product_name: productName,
        alert_type: alertType,
        stock,
        threshold,
        resolved: false,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    logger.info('Inventory alert created', { productId, alertType, stock })
  } catch (error) {
    logger.error('Failed to create inventory alert', { error, productId, alertType })
  }
}

/**
 * Get unresolved inventory alerts
 */
export const getInventoryAlerts = async (resolved: boolean = false): Promise<InventoryAlert[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select('*')
      .eq('resolved', resolved)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    logger.error('Failed to fetch inventory alerts', { error, resolved })
    return []
  }
}

/**
 * Resolve inventory alert
 */
export const resolveInventoryAlert = async (alertId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inventory_alerts')
      .update({ resolved: true })
      .eq('id', alertId)

    if (error) throw error

    logger.info('Inventory alert resolved', { alertId })
  } catch (error) {
    logger.error('Failed to resolve inventory alert', { error, alertId })
  }
}

/**
 * Check and create alerts for low stock
 */
export const checkLowStockAndAlert = async (threshold: number = 10): Promise<void> => {
  try {
    const lowStockProducts = await getLowStockProducts(threshold)

    for (const product of lowStockProducts) {
      // Check if alert already exists and is unresolved
      const { data: existingAlerts } = await supabase
        .from('inventory_alerts')
        .select('*')
        .eq('product_id', product.id)
        .eq('resolved', false)
        .single()

      if (!existingAlerts) {
        const alertType = product.stock === 0 ? 'out_of_stock' : 'low_stock'
        await createInventoryAlert(
          product.id,
          product.name,
          alertType,
          product.stock,
          threshold
        )
      }
    }
  } catch (error) {
    logger.error('Failed to check low stock and create alerts', { error, threshold })
  }
}
