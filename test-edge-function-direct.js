// Test Edge Function directly to get detailed error response
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseAnonKey = 'sb_publishable_faL1nLybWD8uw9uN3K39Cw_VubwRYfz'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testEdgeFunctionDirect() {
  try {
    console.log('=== Testing Edge Function Directly ===')
    
    // Get a real session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log('No session found, testing with fake token first...')
      
      // Test with fake token to see what error we get
      const fakeResponse = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake_token_test'
        },
        body: JSON.stringify({
          amount: 100,
          currency: 'INR',
          receipt: 'test_direct_' + Date.now()
        })
      })
      
      const fakeText = await fakeResponse.text()
      console.log('Fake token response:', fakeResponse.status, fakeText)
      
      return
    }
    
    console.log('Found session, testing with real token...')
    console.log('Session details:', {
      userId: session.user?.id,
      expiresAt: session.expires_at,
      tokenLength: session.access_token?.length
    })
    
    // Test with real session
    const response = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: 'test_direct_' + Date.now()
      })
    })
    
    const text = await response.text()
    console.log('Real session response:', response.status, text)
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text)
      console.log('Parsed JSON response:', json)
    } catch (parseError) {
      console.log('Response is not valid JSON:', text)
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testEdgeFunctionDirect()
