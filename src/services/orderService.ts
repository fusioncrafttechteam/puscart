import { supabase } from './supabase'

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

export interface Order {
  id: string
  user_id: string
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  delivery_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  delivery_address: string
  phone: string
  delivery_address_id?: string
  products?: ProductItem[]
  order_items?: ProductItem[]
  created_at: string
  updated_at: string
}

export const checkPendingOrder = async (userId: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .eq("delivery_status", "pending")
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export const getOrCreatePendingOrder = async (orderData: {
  user_id: string
  total_amount: number
  delivery_address_id: string
  delivery_address: string
  phone: string
  items: Array<{
    product_id: string
    quantity: number
    price: number
  }>
}): Promise<Order> => {
  try {
    // Step 1: Check for existing pending order
    const existingOrder = await checkPendingOrder(orderData.user_id);

    // Step 2: Return existing order if found
    if (existingOrder) {
      return existingOrder;
    }

    // Step 3: Prepare products array for unified table
    const products = orderData.items.map(item => ({
      id: crypto.randomUUID(), // Generate unique ID for each product item
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: new Date().toISOString()
    }));

    // Step 4: Create new order with unified products structure
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: orderData.user_id,
        total_amount: orderData.total_amount,
        delivery_address_id: orderData.delivery_address_id,
        delivery_address: orderData.delivery_address,
        phone: orderData.phone,
        products: products,
        payment_status: 'pending',
        delivery_status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      // Handle duplicate key error safely
      if (orderError.code === '23505' || orderError.message.includes('unique_pending_order_per_user')) {
        const fallbackOrder = await checkPendingOrder(orderData.user_id);
        if (fallbackOrder) {
          return fallbackOrder;
        }
      }
      throw orderError
    }

    return order;
  } catch (error) {
    throw error
  }
}

export const createOrder = async (orderData: {
  user_id: string
  total_amount: number
  delivery_address_id: string
  delivery_address: string
  phone: string
  items: Array<{
    product_id: string
    quantity: number
    price: number
  }>
}): Promise<Order> => {
  try {
    // Prepare products array for unified table
    const products = orderData.items.map(item => ({
      id: crypto.randomUUID(), // Generate unique ID for each product item
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: new Date().toISOString()
    }));

    // Create order with unified products structure
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: orderData.user_id,
        total_amount: orderData.total_amount,
        delivery_address_id: orderData.delivery_address_id,
        delivery_address: orderData.delivery_address,
        phone: orderData.phone,
        products: products,
        payment_status: 'pending',
        delivery_status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    return order
  } catch (error) {
    throw error
  }
}

export const updateOrderPayment = async (orderId: string, orderData: {
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  delivery_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
}): Promise<void> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: orderData.payment_status,
        ...(orderData.delivery_status && { delivery_status: orderData.delivery_status }),
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)

    if (error) {
      throw error
    }
  } catch (error) {
    throw error
  }
}

export const cancelPendingOrder = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        delivery_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("delivery_status", "pending")

    if (error) {
      throw error
    }
  } catch (error) {
    throw error
  }
}

export const getUserOrders = async (): Promise<Order[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return []
  }

  try {
    // Direct query to orders table with proper error handling
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_amount,
        payment_status,
        delivery_status,
        delivery_address,
        phone,
        delivery_address_id,
        products,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback: try the RPC function if direct query fails
      const { data: fallbackOrders, error: fallbackError } = await supabase
        .rpc('get_user_orders_with_items', { user_id_param: user.id })

      if (fallbackError) {
        throw fallbackError
      }

      return fallbackOrders || []
    }

    return orders || []
  } catch (error) {
    // Return empty array instead of throwing to prevent app crash
    return []
  }
}
