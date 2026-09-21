// Test to check if there's a difference in session handling
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseAnonKey = 'sb_publishable_faL1nLybWD8uw9uN3K39Cw_VubwRYfz'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSessionDifference() {
  try {
    console.log('=== Testing Session Difference ===')
    
    // Get actual session from browser
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('❌ No session found in browser')
      return
    }
    
    console.log('✅ Session found in browser:')
    console.log('Session details:', {
      userId: session.user?.id,
      email: session.user?.email,
      expiresAt: session.expires_at,
      tokenLength: session.access_token?.length,
      tokenPreview: session.access_token?.substring(0, 20) + '...'
    })
    
    // Test with this exact session
    console.log('Testing Edge Function with actual browser session...')
    
    const response = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        amount: 60,
        currency: 'INR',
        receipt: 'receipt_885e5002_1778318783842'
      })
    })
    
    const text = await response.text()
    console.log('Actual session response:', response.status, text)
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text)
      console.log('Parsed response:', JSON.stringify(json, null, 2))
      
      if (response.status === 500) {
        console.log('🔍 500 Error with actual session found!')
        console.log('Error details:', json)
        
        // Check if error message gives us clues
        if (json.error && json.error.includes('receipt')) {
          console.log('📝 Receipt-related error detected')
        } else if (json.error && json.error.includes('amount')) {
          console.log('📝 Amount-related error detected')
        } else {
          console.log('📝 Other error type')
        }
      }
    } catch (parseError) {
      console.log('Non-JSON response:', text)
    }
    
  } catch (error) {
    console.error('Session test error:', error)
  }
}

testSessionDifference()
