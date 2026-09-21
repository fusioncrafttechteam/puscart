// Test script to verify authentication handling in Razorpay service
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseAnonKey = 'sb_publishable_faL1nLybWD8uw9uN3K39Cw_VubwRYfz'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthSession() {
  try {
    console.log('Testing authentication session...')
    
    // Test 1: Get current session (should be null if not logged in)
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('Session result:', { session: session ? 'exists' : 'null', error })
    
    if (session) {
      console.log('Session found, testing Razorpay order creation...')
      
      // Test 2: Try to create Razorpay order with valid session
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-order', {
        body: {
          amount: 100,
          currency: 'INR',
          receipt: 'test_receipt_' + Date.now()
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      console.log('Order creation result:', { orderData, orderError })
      
      if (orderError) {
        console.error('❌ Order creation failed:', orderError)
      } else {
        console.log('✅ Order creation successful!')
      }
    } else {
      console.log('❌ No session found - user needs to login')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAuthSession()
