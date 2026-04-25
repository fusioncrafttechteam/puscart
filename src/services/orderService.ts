import { supabase } from './supabase'

export interface Order {
  id: string
  user_id: string
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  delivery_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  delivery_address: string
  phone: string
  razorpay_order_id?: string
  razorpay_payment_id?: string
  delivery_address_id?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
  product?: {
    id: string
    name: string
    image: string
  }
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

export const checkPendingOrder = async (userId: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .eq("payment_status", "pending")
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking pending order:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error checking pending order:', error)
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
      console.log('Found existing pending order:', existingOrder.id);
      return existingOrder;
    }

    // Step 3: Create new order if none exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: orderData.user_id,
        total_amount: orderData.total_amount,
        delivery_address_id: orderData.delivery_address_id,
        delivery_address: orderData.delivery_address,
        phone: orderData.phone,
        payment_status: 'pending',
        delivery_status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      // Step 8: Handle duplicate key error safely
      if (orderError.code === '23505' || orderError.message.includes('unique_pending_order_per_user')) {
        console.log('Duplicate pending order detected, fetching existing order...');
        const fallbackOrder = await checkPendingOrder(orderData.user_id);
        if (fallbackOrder) {
          return fallbackOrder;
        }
      }
      console.error('Error creating order:', orderError)
      throw orderError
    }

    // Then create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      throw itemsError
    }

    console.log('Created new pending order:', order.id);
    return order;
  } catch (error) {
    console.error('Error in getOrCreatePendingOrder:', error)
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
    // First, create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: orderData.user_id,
        total_amount: orderData.total_amount,
        delivery_address_id: orderData.delivery_address_id,
        delivery_address: orderData.delivery_address,
        phone: orderData.phone,
        payment_status: 'pending',
        delivery_status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw orderError
    }

    // Then create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      throw itemsError
    }

    return order
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

export const updateOrderPayment = async (orderId: string, paymentData: {
  razorpay_order_id: string
  razorpay_payment_id: string
  payment_status: 'pending' | 'paid' | 'failed'
}): Promise<void> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        payment_status: paymentData.payment_status,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)

    if (error) {
      console.error('Error updating order payment:', error)
      throw error
    }
  } catch (error) {
    console.error('Error updating order payment:', error)
    throw error
  }
}

export const cancelPendingOrder = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ 
        payment_status: 'cancelled',
        delivery_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("payment_status", "pending")

    if (error) {
      console.error('Error cancelling pending order:', error)
      throw error
    }
  } catch (error) {
    console.error('Error cancelling pending order:', error)
    throw error
  }
}

export const getUserOrders = async (): Promise<OrderWithItems[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (
          id,
          name,
          image
        )
      )
    `)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error('Error fetching user orders:', error)
    throw error
  }

  return data || []
}
