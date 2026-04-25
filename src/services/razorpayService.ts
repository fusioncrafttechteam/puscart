
export interface RazorpayOrder {
  razorpay_order_id: string
  amount: number
  currency: string
  receipt: string
  status: string
  order_id: string
}

export interface PaymentVerification {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

// Create Razorpay order
export const createRazorpayOrder = async (orderData: {
  amount: number;
  user_id: string;
  delivery_address: string;
  phone: string;
  cart_items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
}): Promise<RazorpayOrder & { order_id: string }> => {
  try {
    // Use relative URL for production compatibility
    const baseUrl = import.meta.env.PROD ? '' : 'http://192.168.1.4:3001';
    const response = await fetch(`${baseUrl}/api/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Backend error:', errorData)
      
      // Provide specific error messages based on the error type
      if (errorData.error?.includes('Invalid user_id format')) {
        throw new Error('Invalid user session. Please login again and try.')
      } else if (errorData.error?.includes('Invalid product_id format')) {
        throw new Error('Invalid product data. Please refresh the page and try again.')
      } else if (errorData.error?.includes('violates foreign key constraint')) {
        throw new Error('User account not found. Please login again.')
      } else {
        throw new Error(errorData.error || 'Failed to create Razorpay order')
      }
    }

    const order = await response.json()
    return order
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    throw error
  }
}

// Verify payment
export const verifyPayment = async (paymentData: PaymentVerification): Promise<void> => {
  try {
    // Use relative URL for production compatibility
    const baseUrl = import.meta.env.PROD ? '' : 'http://192.168.1.4:3001';
    const response = await fetch(`${baseUrl}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      throw new Error('Payment verification failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

// Load Razorpay script with proper error handling
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully')
      resolve(true)
    }
    
    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error)
      resolve(false)
    }
    
    document.head.appendChild(script)
  })
}
