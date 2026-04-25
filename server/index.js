import express from 'express'
import cors from 'cors'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env' })

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const app = express()
const PORT = process.env.PORT || 3004

// Middleware
app.use(cors({
  origin: ['http://192.168.1.4:5174', 'http://localhost:5174', 'http://localhost:5175', 'https://your-production-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Security headers
app.use((req, res, next) => {
  // Remove permissions for biometric tracking
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()')
  // Prevent mixed content
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.razorpay.com;")
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Initialize Razorpay with validation
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables')
  process.exit(1)
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Mock payment mode for testing
const MOCK_PAYMENT_MODE = process.env.RAZORPAY_KEY_SECRET === 'YOUR_RAZORPAY_KEY_SECRET'

// Create Razorpay Order
app.post('/api/create-razorpay-order', async (req, res) => {
  const startTime = Date.now()
  
  try {
    const { amount, user_id, delivery_address, phone, cart_items } = req.body

    console.log('🚀 Creating Razorpay order request:', {
      amount,
      user_id,
      phone: phone?.replace(/\d(?=\d{4})/g, '*'), // Mask phone number for logs
      items_count: cart_items?.length
    })

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    if (!user_id || !delivery_address || !phone || !cart_items) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, delivery_address, phone, cart_items' 
      })
    }

    // Validate UUID format for user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(user_id)) {
      return res.status(400).json({ 
        error: 'Invalid user_id format. User ID must be a valid UUID' 
      })
    }

    // Validate cart items structure and UUIDs
    if (!Array.isArray(cart_items) || cart_items.length === 0) {
      return res.status(400).json({ 
        error: 'Cart items must be a non-empty array' 
      })
    }

    for (const item of cart_items) {
      if (!item.product_id || !uuidRegex.test(item.product_id)) {
        return res.status(400).json({ 
          error: 'Invalid product_id format in cart items. Product ID must be a valid UUID' 
        })
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Invalid quantity in cart items. Quantity must be a positive number' 
        })
      }
      if (!item.price || item.price <= 0) {
        return res.status(400).json({ 
          error: 'Invalid price in cart items. Price must be a positive number' 
        })
      }
    }

    console.log('Creating order with data:', { amount, user_id, delivery_address, phone })

    // Step 1: Create order in database first
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user_id,
        total_amount: amount,
        payment_status: 'pending',
        delivery_status: 'pending',
        delivery_address: delivery_address,
        phone: phone
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order in database:', orderError)
      return res.status(500).json({ 
        error: 'Failed to create order in database',
        details: orderError.message 
      })
    }

    console.log('Order created in database:', orderData)

    // Step 2: Create order items
    const orderItems = cart_items.map(item => ({
      order_id: orderData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', orderData.id)
      return res.status(500).json({ 
        error: 'Failed to create order items',
        details: itemsError.message 
      })
    }

    // Step 3: Create Razorpay order with enhanced options
    const options = {
      amount: Math.round(amount * 100), // Convert to paise and ensure integer
      currency: 'INR',
      receipt: `order_${orderData.id}`,
      payment_capture: 1,
      notes: {
        order_id: orderData.id,
        user_id: user_id,
        delivery_address: delivery_address,
        phone: phone,
        items_count: cart_items.length
      },
      callback_url: `${req.protocol}://${req.get('host')}/api/payment-callback`,
      callback_method: 'post'
    }

    console.log('Creating Razorpay order with options:', options)

    let razorpayOrder
    if (MOCK_PAYMENT_MODE) {
      // Mock Razorpay order for testing
      razorpayOrder = {
        id: `mock_order_${Date.now()}`,
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        status: 'created'
      }
      console.log('Using mock Razorpay order:', razorpayOrder.id)
    } else {
      razorpayOrder = await razorpay.orders.create(options)
    }

    // Step 4: Update order with Razorpay order ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        razorpay_order_id: razorpayOrder.id 
      })
      .eq('id', orderData.id)

    if (updateError) {
      console.error('Error updating order with Razorpay ID:', updateError)
      return res.status(500).json({ 
        error: 'Failed to update order with Razorpay ID',
        details: updateError.message 
      })
    }

    console.log('Razorpay order created successfully:', razorpayOrder.id)

    // Step 5: Return response to frontend
    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: orderData.id,
      receipt: razorpayOrder.receipt
    })

  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    console.error('Error stack:', error.stack)
    
    // Return detailed error for debugging
    res.status(500).json({ 
      error: 'Failed to create Razorpay order',
      details: error.message,
      type: error.constructor.name
    })
  }
})

// Verify Payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment verification failed' 
      })
    }

    let isSignatureValid = false

    if (MOCK_PAYMENT_MODE) {
      // For mock mode, always accept payments
      isSignatureValid = true
      console.log('Mock payment mode: accepting payment verification')
    } else {
      // Generate signature
      const body = razorpay_order_id + '|' + razorpay_payment_id
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex')

      // Verify signature
      isSignatureValid = (expectedSignature === razorpay_signature)
    }

    if (isSignatureValid) {
      try {
        // Update order status in database
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            razorpay_payment_id: razorpay_payment_id,
            updated_at: new Date().toISOString()
          })
          .eq('razorpay_order_id', razorpay_order_id)

        if (error) {
          console.error('Error updating order status:', error)
          return res.status(500).json({ 
            success: false,
            error: 'Failed to update order status' 
          })
        }

        res.json({ 
          success: true,
          message: 'Payment verified successfully',
          razorpay_order_id,
          razorpay_payment_id
        })
      } catch (error) {
        console.error('Database error:', error)
        res.status(500).json({ 
          success: false,
          error: 'Database update failed' 
        })
      }
    } else {
      // Payment verification failed
      res.status(400).json({ 
        success: false,
        error: 'Payment verification failed' 
      })
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    res.status(500).json({ error: 'Payment verification failed' })
  }
})

// Payment callback endpoint (webhook)
app.post('/api/payment-callback', async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body
    
    // Verify webhook signature (if Razorpay sends one)
    // This is a placeholder - implement based on Razorpay webhook documentation
    console.log('🔔 Payment webhook received:', { order_id, payment_id })
    
    // Update order status
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
        razorpay_payment_id: payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', order_id)

    if (error) {
      console.error('Error updating order from webhook:', error)
      return res.status(500).json({ error: 'Failed to update order status' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
