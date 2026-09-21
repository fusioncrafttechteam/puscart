// Simple test script to verify Razorpay order creation
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseAnonKey = 'sb_publishable_faL1nLybWD8uw9uN3K39Cw_VubwRYfz'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRazorpayOrder() {
  try {
    console.log('Testing Razorpay order creation...')
    
    // First, let's try to create a test order
    const { data, error } = await supabase.functions.invoke('razorpay-order', {
      body: {
        amount: 100, // 1 rupee test
        currency: 'INR',
        receipt: 'test_receipt_' + Date.now()
      },
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`
      }
    })

    if (error) {
      console.error('❌ Error creating order:', error)
      return false
    }

    console.log('✅ Order created successfully:', data)
    return true
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

testRazorpayOrder()
