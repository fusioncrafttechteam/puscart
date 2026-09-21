/**
 * Reorder Service
 * Handles reordering functionality for past orders
 */

import { supabase } from './supabase'
import { logger } from './loggingService'

export interface ReorderItem {
  product_id: string
  quantity: number
  price: number
}

export const reorderFromOrder = async (orderId: string): Promise<ReorderItem[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('products, user_id')
      .eq('id', orderId)
      .single()

    if (orderError) {
      throw orderError
    }

    if (!order) {
      throw new Error('Order not found')
    }

    // Verify order belongs to user
    if (order.user_id !== user.id) {
      throw new Error('Unauthorized access to order')
    }

    // Extract product items from order
    const items: ReorderItem[] = order.products?.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    })) || []

    logger.logUserAction('reorder_attempt', { orderId, itemCount: items.length })

    return items
  } catch (error) {
    logger.error('Failed to reorder from order', { error, orderId })
    throw error
  }
}

/**
 * Check if products are still available for reorder
 */
export const checkReorderAvailability = async (items: ReorderItem[]): Promise<{
  available: ReorderItem[]
  unavailable: Array<{ product_id: string; reason: string }>
}> => {
  try {
    const productIds = items.map(item => item.product_id)

    // Fetch current product data
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, stock, is_active, price, offer_price')
      .in('id', productIds)

    if (error) {
      throw error
    }

    const available: ReorderItem[] = []
    const unavailable: Array<{ product_id: string; reason: string }> = []

    items.forEach(item => {
      const product = products?.find(p => p.id === item.product_id)

      if (!product) {
        unavailable.push({ product_id: item.product_id, reason: 'Product not found' })
      } else if (!product.is_active) {
        unavailable.push({ product_id: item.product_id, reason: 'Product is no longer available' })
      } else if (product.stock < item.quantity) {
        unavailable.push({ 
          product_id: item.product_id, 
          reason: `Insufficient stock (available: ${product.stock})` 
        })
      } else {
        // Update price to current price
        available.push({
          ...item,
          price: product.offer_price || product.price
        })
      }
    })

    return { available, unavailable }
  } catch (error) {
    logger.error('Failed to check reorder availability', { error, items })
    throw error
  }
}
