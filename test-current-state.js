// Test current authentication state
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseAnonKey = 'sb_publishable_faL1nLybWD8uw9uN3K39Cw_VubwRYfz'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCurrentState() {
  try {
    console.log('=== Testing Current Authentication State ===')
    
    // Check if user is logged in
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('❌ User is NOT logged in')
      console.log('📝 Solution: User needs to log in to the application first')
      console.log('📝 Steps:')
      console.log('  1. Go to the application login page')
      console.log('  2. Enter your credentials')
      console.log('  3. Log in successfully')
      console.log('  4. Try placing an order again')
      console.log('  5. If still getting errors, check browser console for details')
      return
    }
    
    console.log('✅ User IS logged in')
    console.log('User details:', {
      userId: session.user?.id,
      email: session.user?.email,
      expiresAt: session.expires_at,
      tokenLength: session.access_token?.length
    })
    
    // If logged in, test Edge Function
    console.log('Testing Edge Function with current session...')
    
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
    console.log('Edge Function response:', response.status, text)
    
    if (response.status === 200) {
      console.log('🎉 SUCCESS: Edge Function is working correctly!')
      console.log('✅ Razorpay integration is now functional')
    } else {
      console.log('❌ Edge Function still returning errors')
      console.log('📝 Check Supabase Edge Function logs for detailed error information')
    }
    
  } catch (error) {
    console.error('State test error:', error)
  }
}

testCurrentState()
