// Test Edge Function with simulated valid JWT token
async function testEdgeFunctionWithToken() {
  try {
    console.log('=== Testing Edge Function with Simulated Token ===')
    
    // Create a test JWT token that looks valid (this will fail auth but should pass the initial checks)
    const testPayload = {
      "aud": "authenticated",
      "exp": Math.floor(Date.now() / 1000) + 3600, // expires in 1 hour
      "sub": "test-user-id",
      "email": "test@example.com",
      "role": "authenticated",
      "iat": Math.floor(Date.now() / 1000)
    }
    
    // This is a fake JWT but should trigger the Edge Function's auth validation
    const fakeJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzgzMTY3NDJ9.test_signature"
    
    console.log('Testing Edge Function with fake JWT token...')
    
    const response = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fakeJWT}`
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: 'test_jwt_' + Date.now()
      })
    })
    
    const text = await response.text()
    console.log('Edge Function response with fake JWT:', response.status, text)
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text)
      console.log('Parsed response:', JSON.stringify(json, null, 2))
    } catch (parseError) {
      console.log('Non-JSON response:', text)
    }
    
    // Now test with a completely invalid token to see the difference
    console.log('\n=== Testing with completely invalid token ===')
    
    const invalidResponse = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer completely_invalid_token'
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: 'test_invalid_' + Date.now()
      })
    })
    
    const invalidText = await invalidResponse.text()
    console.log('Invalid token response:', invalidResponse.status, invalidText)
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testEdgeFunctionWithToken()
