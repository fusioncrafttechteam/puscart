# RLS Policy Fix - Deployment Guide

## Issue Summary
Authenticated users were receiving 403 errors when trying to create orders after successful Razorpay payment:
```
Failed to create order: new row violates row-level security policy for table "orders"
```

## Root Cause Analysis
The RLS policies on the `orders` table had conflicts or were not properly applied. While the policy logic (`auth.uid() = user_id`) was correct, the actual policy implementation had issues preventing successful INSERT operations.

## Architecture Verification
- **Database Schema**: `orders.user_id` (UUID) references `public.users.id`
- **Authentication**: `auth.users.id` is returned by `auth.uid()`
- **User Sync**: A trigger ensures `public.users.id = auth.users.id` on user creation
- **Frontend**: `paymentService.ts` correctly sets `user_id: user.id` from `supabase.auth.getUser()`

## Solution Applied
Created a comprehensive RLS policy fix that:
1. Removes ALL existing conflicting policies on the `orders` table
2. Creates clean, unambiguous policies using the correct column name (`user_id`)
3. Ensures proper permissions are granted to authenticated users
4. Adds diagnostic capabilities

## Deployment Steps

### Step 1: Run Diagnostic Script (Optional but Recommended)
Run the diagnostic script to understand the current state:
```bash
# Connect to your Supabase database
psql -h <your-db-host> -U postgres -d postgres -f database/diagnose_rls_issue.sql
```

Or run via Supabase SQL Editor in the dashboard.

### Step 2: Apply the RLS Fix
Run the main fix script:
```bash
psql -h <your-db-host> -U postgres -d postgres -f database/fix_orders_rls_policy.sql
```

Or execute the SQL in Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Open `database/fix_orders_rls_policy.sql`
3. Execute the script

### Step 3: Verify the Fix
After applying the fix, verify:
1. Check that policies were created successfully
2. Verify the output shows "ORDERS RLS POLICY FIX APPLIED SUCCESSFULLY"
3. Run the diagnostic script again to confirm the new policies are in place

## Files Created/Modified

### New Files
- `database/fix_orders_rls_policy.sql` - Main fix script
- `database/diagnose_rls_issue.sql` - Diagnostic script
- `RLS_FIX_DEPLOYMENT_GUIDE.md` - This deployment guide

### Files Analyzed (No Changes Needed)
- `database/fix_payment_checkout_flow.sql` - Contains similar policies but may have conflicts
- `database/apply_rls_policies.sql` - Contains general RLS policies
- `database/schema.sql` - Original schema with RLS policies
- `src/services/paymentService.ts` - Frontend service (already correct)
- `public/service-worker.js` - Service worker (already excludes checkout routes)

## RLS Policies Applied

### 1. Users can view own orders
```sql
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
```

### 2. Users can create own orders
```sql
CREATE POLICY "Users can create own orders" 
ON orders FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### 3. Users can update own orders
```sql
CREATE POLICY "Users can update own orders" 
ON orders FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id AND
  delivery_status IN ('pending', 'processing')
);
```

### 4. Admins can view all orders
```sql
CREATE POLICY "Admins can view all orders" 
ON orders FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

### 5. Admins can update all orders
```sql
CREATE POLICY "Admins can update all orders" 
ON orders FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

## Testing Instructions

### Test A: Successful Payment Flow
1. Add a product to cart
2. Proceed to checkout
3. Complete Razorpay payment (test mode)
4. Verify payment signature verification succeeds
5. **Expected**: Order INSERT succeeds, order appears in database, cart clears, success page shows

### Test B: Database Verification
Check the created order in Supabase:
```sql
SELECT 
  id,
  user_id,
  total_amount,
  payment_status,
  delivery_status,
  razorpay_payment_id,
  razorpay_order_id,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

Verify:
- `user_id` matches the authenticated user's ID
- `payment_status` is 'paid'
- `razorpay_payment_id` is populated
- `razorpay_order_id` is populated

### Test C: Duplicate Payment Idempotency
1. Use the same Razorpay payment ID
2. **Expected**: Existing order detected, no second order created, success page shows

### Test D: RLS Security Verification
1. Login as Customer A
2. Check that Customer A can only see their own orders
3. Login as Customer B
4. Check that Customer B cannot see Customer A's orders
5. **Expected**: Each customer only sees their own orders

### Test E: Failed Payment
1. Attempt a failed Razorpay payment
2. **Expected**: No order should be created

### Test F: Admin Access
1. Login as admin user
2. Verify admin can view all orders
3. Verify admin can update any order
4. **Expected**: Admin has full access to all orders

## Service Worker Analysis
The service worker (`public/service-worker.js`) has been verified and does NOT interfere with checkout:
- Lines 58-61: Explicitly excludes `/checkout`, `/order`, `/auth/` routes
- Lines 71-74: Explicitly bypasses Razorpay requests
- Lines 68-70: Explicitly bypasses Supabase API requests
- Lines 49-53: Allows all non-GET requests to pass through

**Conclusion**: Service worker is not causing the issue.

## Frontend Verification
The frontend code in `paymentService.ts` is correct:
- Line 126: `const { data: { user } } = await supabase.auth.getUser();`
- Line 199: `user_id: user.id,` - Correctly sets the authenticated user's ID
- The user ID matches `auth.uid()` used in RLS policies

**Conclusion**: Frontend code is correct, no changes needed.

## Error Handling Improvement
The current error handling in `paymentService.ts` (line 214-216) already provides detailed error messages:
```typescript
if (error) {
  console.error('[Order] Failed to create order:', error);
  throw new Error(`Failed to create order: ${error.message || 'Please try again.'}`);
}
```

After the RLS fix, this error should no longer occur for authenticated users.

## Rollback Plan
If issues arise after deployment:
1. Run the diagnostic script to check current state
2. Re-run `fix_orders_rls_policy.sql` to reapply clean policies
3. If needed, manually adjust policies in Supabase SQL Editor
4. Monitor logs for any 403 errors

## Security Considerations
- ✅ RLS remains enabled (not disabled)
- ✅ Service-role key is NOT used in frontend
- ✅ Razorpay key secret is NOT exposed
- ✅ Users can only access their own data
- ✅ Admins have appropriate access
- ✅ Idempotency is maintained via `razorpay_payment_id` unique constraint

## Monitoring
After deployment, monitor:
1. Order creation success rate
2. 403 errors on orders table
3. Payment verification logs
4. User feedback on checkout flow

## Success Criteria
The fix is successful when:
- ✅ Authenticated users can create orders after successful payment
- ✅ No 403 errors on orders INSERT
- ✅ `user_id === auth.uid()` is maintained
- ✅ Customers can only see their own orders
- ✅ Admins have appropriate access
- ✅ Idempotency is maintained
- ✅ Payment verification still works
- ✅ Cart clears only after successful order creation

## Support
If issues persist:
1. Run `diagnose_rls_issue.sql` to get current state
2. Check Supabase logs for detailed error messages
3. Verify the authenticated user's ID matches the order's user_id
4. Check browser console for frontend errors
5. Verify Razorpay payment verification is succeeding
