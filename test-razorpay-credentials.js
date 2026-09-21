// Test Razorpay API credentials directly
async function testRazorpayCredentials() {
  try {
    console.log('=== Testing Razorpay API Credentials ===')
    
    // Test Razorpay API with the test credentials from .env
    const keyId = 'rzp_test_Sfi5w3z9b9KlN2'
    // Note: We don't have the secret key, so this will fail, but we can see the error
    
    console.log('Testing Razorpay API with key ID:', keyId)
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${keyId}:fake_secret_key`)}`
      },
      body: JSON.stringify({
        amount: 10000, // 100 rupees in paise
        currency: 'INR',
        receipt: 'test_credentials_' + Date.now(),
        notes: {
          test: 'credential_test'
        }
      })
    })
    
    const text = await response.text()
    console.log('Razorpay API response:', response.status, text)
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text)
      console.log('Parsed Razorpay response:', json)
    } catch (parseError) {
      console.log('Razorpay response is not valid JSON:', text)
    }
    
  } catch (error) {
    console.error('Razorpay test error:', error)
  }
}

testRazorpayCredentials()
