// Capture detailed Edge Function error response
async function captureEdgeFunctionError() {
  try {
    console.log('=== Capturing Edge Function Error Details ===')
    
    // First, let's try to get a session by simulating login
    // For now, we'll test with a fake token to see the exact error format
    
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    
    console.log('Testing with fake token to see error structure...')
    
    const response = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fakeToken}`
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: 'test_error_capture_' + Date.now()
      })
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Response body:', text)
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text)
      console.log('Parsed JSON:', JSON.stringify(json, null, 2))
    } catch (parseError) {
      console.log('Not JSON - raw text:', text)
    }
    
    // Now let's test what happens with no auth
    console.log('\n=== Testing with no auth ===')
    
    const noAuthResponse = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: 'test_no_auth_' + Date.now()
      })
    })
    
    console.log('No auth status:', noAuthResponse.status)
    const noAuthText = await noAuthResponse.text()
    console.log('No auth response:', noAuthText)
    
  } catch (error) {
    console.error('Capture error:', error)
  }
}

captureEdgeFunctionError()
