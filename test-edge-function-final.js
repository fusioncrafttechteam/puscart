// Final test of Edge Function with enhanced logging
async function testEdgeFunctionFinal() {
  try {
    console.log('=== Final Edge Function Test ===')
    
    // Test with a valid-looking JWT to trigger the Edge Function
    const testJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzgzMTY3NDJ9.test_signature"
    
    console.log('Testing Edge Function with enhanced logging...')
    
    const response = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testJWT}`
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: 'test_final_' + Date.now()
      })
    })
    
    const text = await response.text()
    console.log('Final test response:', response.status, text)
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text)
      console.log('Parsed response:', JSON.stringify(json, null, 2))
      
      // If we get a 401, that's expected since we're using a fake JWT
      // But we should see the detailed logging in the Edge Function logs
      if (response.status === 401) {
        console.log('✅ Edge Function is working (401 expected for fake JWT)')
        console.log('📝 Check Supabase Edge Function logs for detailed credential information')
        console.log('📝 Go to: https://supabase.com/dashboard/project/tjgklvdmuxnlydwwchso/functions')
        console.log('📝 Click on razorpay-order and check the logs')
      }
    } catch (parseError) {
      console.log('Non-JSON response:', text)
    }
    
  } catch (error) {
    console.error('Final test error:', error)
  }
}

testEdgeFunctionFinal()
