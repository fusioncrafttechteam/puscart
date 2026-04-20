
export interface RazorpayOrder {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  offer_id: string | null
  status: string
  attempts: number
  notes: any[]
  created_at: number
}

export interface PaymentVerification {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

// Create Razorpay order
export const createRazorpayOrder = async (amount: number): Promise<RazorpayOrder> => {
  try {
    const response = await fetch('http://localhost:3003/api/create-razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    })

    if (!response.ok) {
      throw new Error('Failed to create Razorpay order')
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
    const response = await fetch('http://localhost:3003/api/verify-payment', {
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

// Load Razorpay script
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}
