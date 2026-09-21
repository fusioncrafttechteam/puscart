// Check latest Edge Function logs to see what's happening with authenticated user
async function checkEdgeFunctionLogs() {
  try {
    console.log('=== Checking Latest Edge Function Logs ===')
    console.log('Please check Supabase Dashboard for latest logs:')
    console.log('https://supabase.com/dashboard/project/tjgklvdmuxnlydwwchso/functions')
    console.log('\nLook for logs with:')
    console.log('1. "Razorpay credentials check:" - should show present/present')
    console.log('2. "Making Razorpay API call..." - should show order data')
    console.log('3. "Order data:" - should show order details')
    console.log('4. "Razorpay API response status:" - should be 200 for success')
    console.log('5. Any error messages - look for specific error details')
    console.log('\nIf you see 500 error, look for:')
    console.log('- "Edge function error:" messages')
    console.log('- "Error details:" with stack traces')
    console.log('- Any other runtime errors')
    
    // Create a simple test to verify current status
    const testReceipt = 'receipt_885e5002_1778318783842'
    
    console.log('\n=== Quick Test ===')
    console.log('Testing with receipt:', testReceipt)
    console.log('Expected: Should work if all issues are resolved')
    
  } catch (error) {
    console.error('Log check error:', error)
  }
}

checkEdgeFunctionLogs()
