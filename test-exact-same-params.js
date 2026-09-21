// Test Edge Function with exact same parameters as browser
async function testExactSameParams() {
  try {
    console.log('=== Testing with Exact Same Parameters ===')
    
    // Use the exact same receipt format that's being generated
    const testReceipt = 'receipt_885e5002_1778318783842'
    
    // Create a test JWT that looks valid
    const testJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzgzMTY3NDJ9.test_signature"
    
    console.log('Testing with exact same receipt:', testReceipt)
    
    const response = await fetch('https://tjgklvdmuxnlydwwchso.supabase.co/functions/v1/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testJWT}`
      },
      body: JSON.stringify({
        amount: 60,
        currency: 'INR',
        receipt: testReceipt
      })
    })
    
    const text = await response.text()
    console.log('Exact same params response:', response.status, text)
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text)
      console.log('Parsed response:', JSON.stringify(json, null, 2))
      
      if (response.status === 500) {
        console.log('🔍 500 Error details found!')
        console.log('Error object:', json)
      }
    } catch (parseError) {
      console.log('Non-JSON response:', text)
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testExactSameParams()
