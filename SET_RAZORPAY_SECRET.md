# Set Razorpay Secret Key in Supabase

## Steps to Fix the 500 Error:

### 1. Get Your Razorpay Secret Key
- Go to https://dashboard.razorpay.com/
- Navigate to Settings → API Keys  
- Find your test key (starts with `rzp_test_`)
- Copy the **Key Secret** (not the Key ID)

### 2. Set the Secret Key in Supabase
Run this command in your terminal (replace with your actual secret):

```bash
cd "d:\Puscart Delivery\myapp"
npx supabase secrets set RAZORPAY_KEY_SECRET=your_actual_razorpay_secret_key_here
```

### 3. Verify the Secret is Set
```bash
npx supabase secrets list
```

You should see both:
- `RAZORPAY_KEY_ID` ✅
- `RAZORPAY_KEY_SECRET` ✅

### 4. Test the Payment Flow
After setting the secret key, the Razorpay payment integration should work without 500 errors.

## Current Status:
✅ Edge Function deployed with enhanced error logging
✅ Clear error messages for missing credentials
⚠️ Need to set RAZORPAY_KEY_SECRET environment variable

## Why This Fixes the Issue:
The Edge Function was failing because it couldn't authenticate with Razorpay's API due to missing secret key. Once the secret key is properly configured, the Razorpay API calls will succeed and payments will work correctly.
