-- ========================================
-- FIX PAYMENT CHECKOUT FLOW
-- ========================================
-- This migration fixes the payment checkout flow issues:
-- 1. Ensures proper RLS policies for orders table
-- 2. Adds unique constraint on razorpay_payment_id to prevent duplicate orders
-- 3. Ensures payments table has proper RLS policies
-- 4. Adds missing columns if needed

-- Step 1: Ensure razorpay columns exist in orders table
DO $$
BEGIN
  -- Add razorpay_order_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT;
  END IF;

  -- Add razorpay_payment_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'razorpay_payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN razorpay_payment_id TEXT;
  END IF;

  -- Add payment_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 2: Create unique constraint on razorpay_payment_id to prevent duplicate orders
-- First drop any existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_razorpay_payment_id_key'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_razorpay_payment_id_key;
  END IF;
END $$;

-- Add unique constraint on razorpay_payment_id
ALTER TABLE orders 
ADD CONSTRAINT orders_razorpay_payment_id_key 
UNIQUE (razorpay_payment_id);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- Step 4: Drop existing RLS policies on orders table to recreate them properly
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- Step 5: Create proper RLS policies for orders table
-- Users can view their own orders
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create own orders" 
ON orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (limited to certain statuses)
CREATE POLICY "Users can update own orders" 
ON orders FOR UPDATE 
USING (
  auth.uid() = user_id AND
  delivery_status IN ('pending', 'processing')
);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" 
ON orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Admins can update all orders
CREATE POLICY "Admins can update all orders" 
ON orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Step 6: Ensure payments table has proper RLS policies
-- First ensure RLS is enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON payments;

-- Create proper RLS policies for payments table
-- Users can view their own payments
CREATE POLICY "Users can view own payments" 
ON payments FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own payments
CREATE POLICY "Users can create own payments" 
ON payments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" 
ON payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Admins can update all payments
CREATE POLICY "Admins can update all payments" 
ON payments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Step 7: Add comments for documentation
COMMENT ON COLUMN orders.razorpay_order_id IS 'Razorpay order ID for payment tracking';
COMMENT ON COLUMN orders.razorpay_payment_id IS 'Razorpay payment ID for payment tracking (unique constraint prevents duplicate orders)';
COMMENT ON COLUMN orders.payment_id IS 'Reference to payments table';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Payment checkout flow fixes applied successfully!';
  RAISE NOTICE 'RLS policies have been updated for orders and payments tables';
  RAISE NOTICE 'Unique constraint added on razorpay_payment_id to prevent duplicate orders';
  RAISE NOTICE 'Indexes have been created for better query performance';
END $$;
