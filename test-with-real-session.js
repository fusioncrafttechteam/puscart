// Test Edge Function with real session to identify exact issue
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseAnonKey = 'sb_publishable_faL1nLybWD8uw9uN3K39Cw_VubwRYfz'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testWithRealSession() {
  try {
    console.log('=== Testing Edge Function with Real Session ===')
    
    // Get the actual session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('❌ No session found - user needs to log in')
      return
    }
    
    console.log('✅ Session found:')
    console.log('User ID:', session.user?.id)
    console.log('Email:', session.user?.email)
    console.log('Expires at:', session.expires_at)
    
    // Test with exact same parameters as browser
    const exactRequest = {
      amount: 60,
      currency: 'INR',
      receipt: 'receipt_885e5002_1778319798492'
    }
    
    console.log('\n=== Testing with Exact Same Parameters ===')
    console.log('Request:', exactRequest)
    
    const response = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(exactRequest)
    })
    
    console.log('Response status:', response.status)
    
    const text = await response.text()
    console.log('Response body:', text)
    
    try {
      const json = JSON.parse(text)
      console.log('Parsed response:', JSON.stringify(json, null, 2))
      
      if (response.status === 500) {
        console.log('\n🔍 500 Error Analysis:')
        console.log('Error details:', json)
        
        if (json.error) {
          console.log('Error type:', json.error)
          if (json.details) {
            console.log('Error details:', json.details)
          }
          if (json.stack) {
            console.log('Stack trace available')
          }
        }
      }
    } catch (parseError) {
      console.log('Non-JSON response:', text)
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testWithRealSession()
