import { supabase } from './supabase';

// Order interfaces for COD flow
export interface OrderRequest {
  total_amount: number;
  delivery_address: string;
  phone: string;
  delivery_address_id?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
}

// Order interface for paid orders
export interface PaidOrderRequest extends OrderRequest {
  payment_status: 'paid';
  razorpay_order_id: string;
  razorpay_payment_id: string;
  payment_record_id?: string; // Reference to payments table
}

export interface OrderResponse {
  id: string;
  user_id: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  delivery_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: string;
  phone: string;
  delivery_address_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create order directly (COD flow)
 */
export const createOrder = async (request: OrderRequest): Promise<OrderResponse> => {
  try {
    // Validate input parameters
    if (!request.total_amount || typeof request.total_amount !== 'number' || request.total_amount <= 0) {
      throw new Error('Invalid amount. Amount must be a positive number.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated. Please login again.');
    }

    if (!user.id || typeof user.id !== 'string') {
      throw new Error('Invalid user session. Please login again.');
    }

    
    // Prepare products array
    const products = request.items.map(item => ({
      id: crypto.randomUUID(),
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: new Date().toISOString()
    }));

    // Create order directly
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: request.total_amount,
        delivery_address: request.delivery_address,
        phone: request.phone,
        delivery_address_id: request.delivery_address_id || null,
        products: products,
        payment_status: 'pending',
        delivery_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create order. Please try again.');
    }

    if (!data) {
      throw new Error('Failed to create order. Please try again.');
    }

    
    return data as OrderResponse;
  } catch (error: any) {
    // Re-throw with more user-friendly messages
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.message?.includes('CORS')) {
      throw new Error('Network error. Please try again.');
    }
    
    throw error;
  }
};

/**
 * Create paid order (after payment verification)
 * This function now properly integrates with the payments table
 */
export const createPaidOrder = async (request: PaidOrderRequest): Promise<OrderResponse> => {
  try {
    console.log('[Order] Creating paid order with request:', {
      razorpay_payment_id: request.razorpay_payment_id,
      razorpay_order_id: request.razorpay_order_id,
      total_amount: request.total_amount
    });

    // Validate input parameters
    if (!request.total_amount || typeof request.total_amount !== 'number' || request.total_amount <= 0) {
      throw new Error('Invalid amount. Amount must be a positive number.');
    }

    if (!request.razorpay_order_id || !request.razorpay_payment_id) {
      throw new Error('Invalid payment details. Please try again.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated. Please login again.');
    }

    if (!user.id || typeof user.id !== 'string') {
      throw new Error('Invalid user session. Please login again.');
    }

    console.log('[Order] User authenticated:', user.id);

    // Verify payment record exists and is paid
    if (request.payment_record_id) {
      console.log('[Order] Verifying payment record:', request.payment_record_id);
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', request.payment_record_id)
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .maybeSingle(); // Use maybeSingle() to handle cases where no record exists

      if (paymentError && paymentError.code !== 'PGRST116') {
        console.error('[Order] Payment verification error:', paymentError);
        throw new Error('Payment verification failed. Please contact support.');
      }

      if (!paymentRecord) {
        console.error('[Order] Payment record not found or not paid');
        throw new Error('Payment verification failed. Please contact support.');
      }
      
      console.log('[Order] Payment verified successfully');
    }

    // Check for duplicate orders with same payment (idempotency check)
    console.log('[Order] Checking for existing order with payment ID:', request.razorpay_payment_id);
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, user_id, payment_status, total_amount')
      .eq('razorpay_payment_id', request.razorpay_payment_id)
      .maybeSingle(); // Use maybeSingle() to handle cases where no order exists

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('[Order] Error checking for existing order:', checkError);
      throw new Error('Failed to check for existing orders. Please try again.');
    }

    if (existingOrder) {
      console.log('[Order] Order already exists for this payment:', existingOrder.id);
      // Return the existing order instead of throwing an error
      // This provides idempotency - if the same payment is processed twice, we return the existing order
      return existingOrder as OrderResponse;
    }

    console.log('[Order] No existing order found, creating new order');

    // Prepare products array
    const products = request.items.map(item => ({
      id: crypto.randomUUID(),
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: new Date().toISOString()
    }));

    console.log('[Order] Inserting order into database');

    // Create paid order with payment reference
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: request.total_amount,
        delivery_address: request.delivery_address,
        phone: request.phone,
        delivery_address_id: request.delivery_address_id || null,
        products: products,
        payment_status: 'paid',
        delivery_status: 'pending',
        razorpay_order_id: request.razorpay_order_id,
        razorpay_payment_id: request.razorpay_payment_id,
        payment_id: request.payment_record_id || null
      })
      .select()
      .single();

    if (error) {
      console.error('[Order] Failed to create order:', error);
      throw new Error(`Failed to create order: ${error.message || 'Please try again.'}`);
    }

    if (!data) {
      console.error('[Order] No data returned from order creation');
      throw new Error('Failed to create order. Please try again.');
    }

    console.log('[Order] Order created successfully:', data.id);
    return data as OrderResponse;
  } catch (error: any) {
    console.error('[Order] Error in createPaidOrder:', error);
    // Re-throw with more user-friendly messages
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.message?.includes('CORS')) {
      throw new Error('Network error. Please try again.');
    } else if (error.message?.includes('duplicate key')) {
      // Handle duplicate key error - try to fetch the existing order
      console.log('[Order] Duplicate key detected, attempting to fetch existing order');
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('razorpay_payment_id', request.razorpay_payment_id)
        .single();
      
      if (existingOrder) {
        console.log('[Order] Found existing order after duplicate error:', existingOrder.id);
        return existingOrder as OrderResponse;
      }
    }
    
    throw error;
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (): Promise<OrderResponse[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return [];
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return orders as OrderResponse[];
  } catch (error) {
    throw error;
  }
};
