// Debug the Edge Function to see exact error
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseAnonKey = 'sb_publishable_faL1nLybWD8uw9uN3K39Cw_VubwRYfz'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugEdgeFunction() {
  try {
    console.log('Testing Edge Function with detailed debugging...')
    
    // Test 1: Try without auth to see what error we get
    console.log('=== Test 1: No Auth ===')
    const response1 = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: 'test_debug_' + Date.now()
      })
    })
    
    const text1 = await response1.text()
    console.log('No auth response:', response1.status, text1)
    
    // Test 2: Try with fake auth to see what happens
    console.log('=== Test 2: Fake Auth ===')
    const response2 = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake_token_test'
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: 'test_debug_' + Date.now()
      })
    })
    
    const text2 = await response2.text()
    console.log('Fake auth response:', response2.status, text2)
    
    // Test 3: Try with actual session if available
    console.log('=== Test 3: Real Session ===')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      const response3 = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: 100,
          currency: 'INR',
          receipt: 'test_debug_' + Date.now()
        })
      })
      
      const text3 = await response3.text()
      console.log('Real session response:', response3.status, text3)
    } else {
      console.log('No real session available')
    }
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugEdgeFunction()
