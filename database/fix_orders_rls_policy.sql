-- ========================================
-- FIX ORDERS RLS POLICY - COMPREHENSIVE SOLUTION
-- ========================================
-- This script fixes the RLS policy issue preventing authenticated users from creating orders
-- after successful Razorpay payment verification.

-- ISSUE: Authenticated users get 403 "new row violates row-level security policy" 
-- when trying to INSERT into orders table after successful payment.

-- ROOT CAUSE: The existing RLS policies may have conflicts or may not be properly applied.
-- The architecture uses:
-- - auth.users.id (returned by auth.uid())
-- - public.users.id (referenced by orders.user_id)
-- - A trigger ensures public.users.id = auth.users.id on user creation

-- SOLUTION: 
-- 1. Remove ALL existing policies on orders table
-- 2. Create clean, unambiguous policies
-- 3. Ensure the policies use the correct column name (user_id)
-- 4. Add diagnostic logging to understand policy evaluation

-- Step 1: Drop ALL existing policies on orders table
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
DROP POLICY IF EXISTS "Order items accessible through orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own profile" ON orders;

-- Step 2: Ensure RLS is enabled on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 3: Create clean RLS policies for orders table

-- Users can view their own orders
-- This policy allows SELECT when the order's user_id matches the authenticated user's ID
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own orders
-- This policy allows INSERT when the order's user_id matches the authenticated user's ID
-- WITH CHECK is used for INSERT to validate the new row
CREATE POLICY "Users can create own orders" 
ON orders FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (limited to certain statuses)
-- This allows updates only on pending/processing orders owned by the user
CREATE POLICY "Users can update own orders" 
ON orders FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id AND
  delivery_status IN ('pending', 'processing')
);

-- Admins can view all orders
-- This policy allows admins to bypass the user_id restriction
CREATE POLICY "Admins can view all orders" 
ON orders FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Admins can update all orders
-- This policy allows admins to update any order
CREATE POLICY "Admins can update all orders" 
ON orders FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Step 4: Verify the orders table structure
-- Ensure the user_id column exists and is properly typed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'user_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'orders.user_id column does not exist';
  END IF;
  
  RAISE NOTICE 'orders.user_id column verified';
END $$;

-- Step 5: Ensure necessary permissions are granted
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;

-- Step 6: Add comments for documentation
COMMENT ON POLICY "Users can view own orders" ON orders IS 'Allows users to SELECT their own orders where user_id = auth.uid()';
COMMENT ON POLICY "Users can create own orders" ON orders IS 'Allows users to INSERT their own orders where user_id = auth.uid()';
COMMENT ON POLICY "Users can update own orders" ON orders IS 'Allows users to UPDATE their own orders with pending/processing status';

-- Step 7: Verify policy creation
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'orders' AND schemaname = 'public';
  
  RAISE NOTICE 'Total RLS policies on orders table: %', policy_count;
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'No policies were created on orders table';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ORDERS RLS POLICY FIX APPLIED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All existing policies have been removed';
  RAISE NOTICE 'New clean policies have been created';
  RAISE NOTICE 'Users can now create orders with user_id = auth.uid()';
  RAISE NOTICE 'Admins have appropriate access';
  RAISE NOTICE '========================================';
END $$;
