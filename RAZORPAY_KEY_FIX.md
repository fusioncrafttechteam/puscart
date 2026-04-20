# Razorpay Key Issue Fix

## Problem
The current Razorpay key is returning 401 Unauthorized error, which means the key is invalid or not properly configured.

## Solution Options

### Option 1: Use Valid Test Key
Replace the current key with a valid Razorpay test key:

**Backend (.env):**
```env
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G6T
RAZORPAY_KEY_SECRET=your_test_secret_key
```

**Frontend (.env):**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G6T
```

### Option 2: Get Your Own Test Keys
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Login or create account
3. Go to Settings → API Keys
4. Generate test keys
5. Copy Key ID and Key Secret
6. Update both .env files

### Option 3: Test Mode Setup
For testing, you can use Razorpay's sample test credentials:
- **Key ID**: `rzp_test_1DP5mmOlF5G6T`
- **Test Cards**: `4111 1111 1111 1111`

## Steps to Fix

1. **Update Backend Key** in `server/.env`
2. **Update Frontend Key** in `.env`
3. **Restart Backend Server**: `cd server && npm run dev`
4. **Restart Frontend**: `npm run dev`
5. **Test Payment Flow**

## Verification
After updating keys, the 401 error should disappear and Razorpay checkout should work properly.
