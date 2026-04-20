import express from 'express'
import cors from 'cors'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Create Razorpay Order
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    }

    const order = await razorpay.orders.create(options)

    res.json(order)
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// Verify Payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters' })
    }

    // Generate signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    // Verify signature
    if (expectedSignature === razorpay_signature) {
      // Payment is successful
      res.json({ 
        success: true,
        message: 'Payment verified successfully',
        razorpay_order_id,
        razorpay_payment_id
      })
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
