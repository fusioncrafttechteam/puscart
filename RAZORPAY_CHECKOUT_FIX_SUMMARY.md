# Razorpay Checkout Flow Fix - Summary

## Root Cause Analysis

### 1. Supabase 403 Error
**Root Cause**: The RLS policies on the `orders` table were not properly configured to allow authenticated users to INSERT their own orders. The existing policies may have been incomplete or conflicting.

**Fix Applied**: 
- Created a comprehensive database migration (`fix_payment_checkout_flow.sql`) that:
  - Drops and recreates all RLS policies on the `orders` table
  - Ensures users can INSERT their own orders with `WITH CHECK (auth.uid() = user_id)`
  - Ensures users can SELECT their own orders with `USING (auth.uid() = user_id)`
  - Adds proper admin policies for viewing and updating all orders
  - Also fixes RLS policies on the `payments` table

### 2. Supabase 406 Error
**Root Cause**: In `paymentService.ts` line 146-154, the code used `.single()` to check for existing orders. When no order exists, `.single()` throws a 406 error instead of returning null, causing the payment flow to fail.

**Fix Applied**:
- Changed `.single()` to `.maybeSingle()` in the duplicate order check
- Added proper error handling for the `PGRST116` (not found) error code
- Now safely handles cases where no order exists without throwing errors

### 3. Service Worker "Failed to fetch" Error
**Root Cause**: The service worker was intercepting `/checkout` requests and trying to handle them with caching logic, which caused network errors for critical payment flows.

**Fix Applied**:
- Modified `handleCriticalRequest()` function in `service-worker.js`
- Added logic to bypass service worker interception for:
  - POST requests (payment/API calls)
  - Supabase API requests (`supabase.co`)
  - Razorpay requests (`razorpay.com`)
- These requests now go directly to the network without service worker interference

### 4. Missing Idempotency/Duplicate Protection
**Root Cause**: There was no protection against creating duplicate orders for the same Razorpay payment ID. If a customer refreshed the page or the payment callback was triggered twice, duplicate orders could be created.

**Fix Applied**:
- Added a unique constraint on `razorpay_payment_id` in the `orders` table
- Implemented idempotency check in `createPaidOrder()` function:
  - Before inserting, checks if an order already exists for the payment ID
  - If it exists, returns the existing order instead of creating a new one
  - Handles duplicate key errors gracefully by fetching the existing order
- Added comprehensive logging to track duplicate payment scenarios

### 5. Cart Clearing Before Order Confirmation
**Root Cause**: The cart was being cleared before the order was successfully created in the database. If order creation failed after payment, the customer would lose their cart items but have no order.

**Fix Applied**:
- Moved `clearCart()` call to AFTER successful order creation
- Added proper error handling to ensure cart is only cleared when order is confirmed
- Added logging to track cart clearing timing

### 6. Missing Payment Verification Error Handling
**Root Cause**: If payment verification failed after successful Razorpay payment, the error message was generic and didn't inform the customer that their payment was successful.

**Fix Applied**:
- Added specific error handling for payment verification failures
- Shows clear message: "Payment was successful but we could not verify it. Please do not pay again. Your payment ID is XXXXX. Please contact support with this payment ID."
- Prevents customers from making duplicate payments

### 7. Insufficient Debug Logging
**Root Cause**: There was minimal logging in the payment flow, making it difficult to debug issues.

**Fix Applied**:
- Added comprehensive logging throughout the payment flow:
  - `[Razorpay]` prefix for Razorpay-related operations
  - `[Order]` prefix for order creation operations
  - `[Checkout]` prefix for checkout page operations
- Logs key events: payment start, success, verification, order creation, cart clearing
- Does NOT log sensitive data (secrets, keys, passwords)

## Files Changed

### 1. `src/services/paymentService.ts`
**Changes**:
- Fixed duplicate order check to use `.maybeSingle()` instead of `.single()`
- Added proper error handling for PGRST116 (not found) error
- Implemented idempotency: returns existing order if payment ID already used
- Added comprehensive logging throughout the order creation process
- Added special handling for duplicate key errors
- Improved error messages for payment verification failures

### 2. `src/services/razorpayService.ts`
**Changes**:
- Added comprehensive logging for payment process steps
- Logs order creation, payment success, verification steps
- Improved error handling and logging

### 3. `src/pages/Checkout.tsx`
**Changes**:
- Added comprehensive logging for checkout process
- Moved cart clearing to AFTER successful order creation
- Added special handling for "Order already exists" case (treats as success)
- Added specific error message for payment verification failures
- Improved error handling for payment cancellation
- Better user feedback for different error scenarios

### 4. `public/service-worker.js`
**Changes**:
- Modified `handleCriticalRequest()` to bypass service worker for:
  - POST requests
  - Supabase API calls
  - Razorpay requests
- Prevents service worker from interfering with payment flows

### 5. `database/fix_payment_checkout_flow.sql` (NEW FILE)
**Changes**:
- Ensures Razorpay columns exist in orders table
- Adds unique constraint on `razorpay_payment_id` to prevent duplicate orders
- Creates proper indexes for better query performance
- Drops and recreates RLS policies for orders table
- Drops and recreates RLS policies for payments table
- Adds admin policies for both tables
- Adds documentation comments

## Database Changes Required

### Migration File: `database/fix_payment_checkout_flow.sql`

This migration must be applied to your Supabase database. It:

1. **Ensures columns exist**: Adds `razorpay_order_id`, `razorpay_payment_id`, and `payment_id` columns to the orders table if they don't exist

2. **Adds unique constraint**: Creates a unique constraint on `razorpay_payment_id` to prevent duplicate orders for the same payment

3. **Creates indexes**: Adds indexes for better query performance on Razorpay-related columns

4. **Fixes RLS policies**: 
   - Drops existing RLS policies on orders and payments tables
   - Creates proper RLS policies that allow users to:
     - SELECT their own orders/payments
     - INSERT their own orders/payments
     - UPDATE their own orders (limited to certain statuses)
   - Creates admin policies for viewing and updating all orders/payments

## Deployment Steps

### Step 1: Apply Database Migration

Run the following SQL migration in your Supabase SQL Editor:

```sql
-- Execute the entire contents of: database/fix_payment_checkout_flow.sql
```

Or run it via Supabase CLI:
```bash
supabase db push
```

### Step 2: Deploy Code Changes

Deploy the updated files to your production environment:

1. **Commit the changes**:
```bash
git add src/services/paymentService.ts
git add src/services/razorpayService.ts
git add src/pages/Checkout.tsx
git add public/service-worker.js
git add database/fix_payment_checkout_flow.sql
git commit -m "Fix Razorpay checkout flow - resolve 403/406 errors, add idempotency, improve error handling"
```

2. **Push to your repository**:
```bash
git push origin main
```

3. **Deploy to production** (using your deployment method, e.g., Vercel, Netlify, etc.)

### Step 3: Update Environment Variables (if needed)

Ensure your Supabase Edge Functions have the required environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

These should already be set, but verify they are correct.

### Step 4: Clear Service Worker Cache

After deploying, users may need to clear their service worker cache to get the updated service worker. You can:

1. Increment the cache version in `service-worker.js` (already done: v1.1.0)
2. Or instruct users to clear their browser cache
3. Or the new service worker will automatically update on next page load

### Step 5: Deploy Edge Functions (if modified)

If you modified the Edge Functions, redeploy them:

```bash
supabase functions deploy razorpay-order
supabase functions deploy razorpay-verify
```

## Testing Checklist

### Test 1: Successful Payment Flow
- [ ] Add product to cart
- [ ] Go to checkout
- [ ] Select delivery address
- [ ] Click "Pay Securely with Razorpay"
- [ ] Complete Razorpay payment successfully
- [ ] Verify payment is processed
- [ ] Verify order is created in Supabase `orders` table
- [ ] Verify order has correct `razorpay_payment_id` and `razorpay_order_id`
- [ ] Verify cart is cleared
- [ ] Verify user is redirected to order success page
- [ ] Check browser console for `[Razorpay]`, `[Order]`, `[Checkout]` logs

### Test 2: Duplicate Payment Protection
- [ ] Complete a successful payment (Test 1)
- [ ] Note the `razorpay_payment_id`
- [ ] Try to create another order with the same `razorpay_payment_id` (simulate via API or refresh)
- [ ] Verify NO duplicate order is created
- [ ] Verify the existing order is returned instead
- [ ] Verify user sees order success (not error)

### Test 3: Payment Cancellation
- [ ] Add product to cart
- [ ] Go to checkout
- [ ] Click "Pay Securely with Razorpay"
- [ ] Cancel the payment in Razorpay modal
- [ ] Verify user sees "Payment was cancelled" message
- [ ] Verify NO order is created in Supabase
- [ ] Verify cart is NOT cleared
- [ ] Verify user can try again

### Test 4: Payment Verification Failure
- [ ] Simulate a payment verification failure (e.g., modify Edge Function to return error)
- [ ] Complete Razorpay payment
- [ ] Verify user sees specific error message: "Payment was successful but we could not verify it..."
- [ ] Verify payment ID is shown in error message
- [ ] Verify user is instructed not to pay again

### Test 5: Network Failure After Payment
- [ ] Complete Razorpay payment successfully
- [ ] Simulate network failure during order creation (e.g., disconnect network)
- [ ] Verify user sees appropriate error message
- [ ] Verify cart is NOT cleared (since order creation failed)
- [ ] When network is restored, user can retry and system should find existing payment

### Test 6: RLS Policy Verification
- [ ] Login as a regular user
- [ ] Create an order
- [ ] Verify user can SELECT their own order
- [ ] Verify user CANNOT SELECT other users' orders
- [ ] Login as admin
- [ ] Verify admin can SELECT all orders
- [ ] Verify admin can UPDATE orders

### Test 7: Service Worker Behavior
- [ ] Open browser DevTools > Application > Service Workers
- [ ] Verify service worker is active
- [ ] Complete a payment flow
- [ ] Verify no "Failed to fetch" errors in console
- [ ] Verify Supabase API requests are not intercepted
- [ ] Verify Razorpay requests are not intercepted

### Test 8: Browser Console Logs
- [ ] Complete a payment flow
- [ ] Open browser console
- [ ] Verify you see:
  - `[Razorpay] Starting payment process for amount: X`
  - `[Razorpay] Order created: order_XXX`
  - `[Razorpay] Payment success callback received`
  - `[Razorpay] Payment response validated`
  - `[Razorpay] Starting payment verification`
  - `[Razorpay] Payment verification result: true`
  - `[Order] Creating paid order with request: {...}`
  - `[Order] User authenticated: user_id`
  - `[Order] Payment verified successfully`
  - `[Order] Order created successfully: order_id`
  - `[Checkout] Clearing cart`
  - `[Checkout] Redirecting to success page`
- [ ] Verify NO sensitive data (secrets, keys) is logged

## Security Considerations

### ✅ Secure Payment Verification
- Payment verification is done server-side in Edge Functions
- Razorpay secret is NEVER exposed to frontend
- Signature verification uses HMAC SHA256
- Payment details are fetched from Razorpay API for confirmation

### ✅ No Exposed Secrets
- Supabase service-role key is NOT in frontend code
- Razorpay secret is NOT in frontend code
- Only anon/public keys are used in frontend
- Edge Functions use service-role key securely

### ✅ RLS Enabled
- RLS is enabled on both `orders` and `payments` tables
- Users can only access their own data
- Admins have proper access through role-based policies
- No global RLS bypass

### ✅ Idempotency
- Unique constraint on `razorpay_payment_id` prevents duplicate orders
- Application-level check before insertion
- Graceful handling of duplicate key errors

## Monitoring and Debugging

### Browser Console Logs
The payment flow now logs key events with prefixes:
- `[Razorpay]` - Razorpay SDK and API operations
- `[Order]` - Order creation and database operations
- `[Checkout]` - Checkout page flow and user interactions

### Supabase Logs
Check Supabase dashboard for:
- Edge Function logs (razorpay-order, razorpay-verify)
- Database query logs
- RLS policy violations

### Common Issues and Solutions

**Issue**: Still getting 403 errors
**Solution**: 
- Verify database migration was applied
- Check RLS policies in Supabase dashboard
- Ensure user is authenticated

**Issue**: Still getting 406 errors
**Solution**:
- Verify code changes were deployed
- Check browser console for specific error
- Ensure `.maybeSingle()` is being used

**Issue**: Service worker still causing issues
**Solution**:
- Clear browser cache and service worker cache
- Verify new service worker is active
- Check browser console for service worker errors

**Issue**: Duplicate orders still being created
**Solution**:
- Verify unique constraint was applied in database
- Check that `razorpay_payment_id` is being saved correctly
- Review logs for duplicate payment scenarios

## Summary

The Razorpay checkout flow has been comprehensively fixed with:

1. **✅ Fixed 403 errors**: Proper RLS policies allow users to create orders
2. **✅ Fixed 406 errors**: Safe query handling for missing orders
3. **✅ Fixed service worker**: No interference with payment/API requests
4. **✅ Added idempotency**: Unique constraint prevents duplicate orders
5. **✅ Secure verification**: Server-side payment verification with no exposed secrets
6. **✅ Better error handling**: Clear user messages for different failure scenarios
7. **✅ Cart clearing fix**: Cart only cleared after successful order creation
8. **✅ Comprehensive logging**: Debug logs for troubleshooting without exposing secrets

The payment flow is now robust, secure, and provides a good user experience even when things go wrong.
