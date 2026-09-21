-- Fix Admin Dashboard Revenue Calculation RLS Policy
-- This ensures admins can view ALL orders for revenue calculation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Create user policy that EXCLUDES admins
CREATE POLICY "Users can view own orders" ON orders FOR SELECT 
USING (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create admin policy to view all orders
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Recreate other order policies (INSERT, UPDATE) if they don't exclude admins
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

CREATE POLICY "Users can create own orders" ON orders FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can update own orders" ON orders FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Admin Dashboard RLS policies fixed successfully!' as status;
