// Test Edge Function with proper credentials
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseAnonKey = 'sb_publishable_faL1nLybWD8uw9uN3K39Cw_VubwRYfz'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testWithCredentials() {
  try {
    console.log('=== Testing Edge Function with Proper Credentials ===')
    
    // Test Razorpay API directly first
    console.log('Testing Razorpay API directly...')
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa('rzp_test_Sfi5w3z9b9KlN2:qxFWtSs6jo3cxXVpHMliLIZR')}`
      },
      body: JSON.stringify({
        amount: 10000, // 100 rupees in paise
        currency: 'INR',
        receipt: 'test_direct_' + Date.now(),
        notes: {
          test: 'direct_api_test'
        }
      })
    })
    
    const razorpayText = await razorpayResponse.text()
    console.log('Direct Razorpay API response:', razorpayResponse.status, razorpayText)
    
    if (razorpayResponse.ok) {
      console.log('✅ Razorpay API working correctly!')
      
      // Now test the Edge Function
      console.log('\n=== Testing Edge Function ===')
      
      // Get a session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('❌ No session found - need to login first')
        return
      }
      
      console.log('✅ Session found, testing Edge Function...')
      
      const edgeResponse = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: 100,
          currency: 'INR',
          receipt: 'test_edge_' + Date.now()
        })
      })
      
      const edgeText = await edgeResponse.text()
      console.log('Edge Function response:', edgeResponse.status, edgeText)
      
      try {
        const edgeJson = JSON.parse(edgeText)
        console.log('Parsed Edge Function response:', JSON.stringify(edgeJson, null, 2))
      } catch (parseError) {
        console.log('Edge Function response is not JSON:', edgeText)
      }
      
    } else {
      console.log('❌ Razorpay API still failing')
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testWithCredentials()
