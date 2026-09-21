-- ========================================
-- COMPLETE PAYMENT INTEGRATION FIX
-- ========================================
-- This script fixes all payment and order integration issues
-- Run this in your Supabase SQL editor

-- Step 1: Ensure all required tables exist
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method VARCHAR(50) DEFAULT 'razorpay',
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  razorpay_signature TEXT,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Step 3: Ensure orders table has payment relationship
DO $$
BEGIN
    -- Add payment_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added payment_id column to orders table';
    END IF;

    -- Add products column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'products'
    ) THEN
        ALTER TABLE orders ADD COLUMN products JSONB DEFAULT '[]'::JSONB;
        RAISE NOTICE 'Added products column to orders table';
    END IF;
END $$;

-- Step 4: Create order indexes
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Step 5: Create or replace payment functions
CREATE OR REPLACE FUNCTION create_payment_with_order(
  p_user_id UUID,
  p_razorpay_order_id VARCHAR(255),
  p_amount DECIMAL(10,2),
  p_currency VARCHAR(3) DEFAULT 'INR',
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_id UUID;
BEGIN
  -- Create payment record
  INSERT INTO payments (
    user_id, 
    razorpay_order_id, 
    amount, 
    currency, 
    status,
    metadata
  )
  VALUES (
    p_user_id,
    p_razorpay_order_id,
    p_amount,
    p_currency,
    'pending',
    p_metadata
  )
  RETURNING id INTO payment_id;
  
  RETURN payment_id;
END;
$$;

-- Step 6: Create improved order creation function
CREATE OR REPLACE FUNCTION create_order_after_payment(
  p_payment_id UUID,
  p_user_id UUID,
  p_total_amount DECIMAL(10,2),
  p_delivery_address TEXT,
  p_phone VARCHAR(20),
  p_delivery_address_id UUID DEFAULT NULL,
  p_products JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_id UUID;
  payment_record RECORD;
BEGIN
  -- Lock payment record to prevent race conditions
  SELECT * INTO payment_record 
  FROM payments 
  WHERE id = p_payment_id AND user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found or access denied';
  END IF;
  
  -- Check payment status
  IF payment_record.status != 'paid' AND payment_record.status != 'processing' THEN
    RAISE EXCEPTION 'Payment must be verified before creating order. Current status: %', payment_record.status;
  END IF;
  
  -- Check if order already exists for this payment
  IF EXISTS (
    SELECT 1 FROM orders WHERE payment_id = p_payment_id
  ) THEN
    RAISE EXCEPTION 'Order already exists for this payment';
  END IF;
  
  -- Create order with payment reference
  INSERT INTO orders (
    user_id,
    total_amount,
    payment_status,
    delivery_status,
    delivery_address,
    phone,
    delivery_address_id,
    products,
    payment_id
  )
  VALUES (
    p_user_id,
    p_total_amount,
    'paid',
    'pending',
    p_delivery_address,
    p_phone,
    p_delivery_address_id,
    COALESCE(p_products, '[]'::JSONB),
    p_payment_id
  )
  RETURNING id INTO order_id;
  
  -- Update payment status to paid (if not already)
  UPDATE payments 
  SET status = 'paid',
      updated_at = NOW()
  WHERE id = p_payment_id AND status != 'paid';
  
  RETURN order_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create order: %', SQLERRM;
END;
$$;

-- Step 7: Create payment status update function
CREATE OR REPLACE FUNCTION update_payment_status_with_order(
  p_payment_id UUID,
  p_status VARCHAR(20),
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  payment_record RECORD;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Get payment record
  SELECT * INTO payment_record 
  FROM payments 
  WHERE id = p_payment_id AND user_id = current_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update payment status
  UPDATE payments 
  SET 
    status = p_status,
    failure_reason = p_failure_reason,
    updated_at = NOW()
  WHERE id = p_payment_id AND user_id = current_user_id;
  
  -- If payment failed, ensure no order exists
  IF p_status = 'failed' THEN
    DELETE FROM orders WHERE payment_id = p_payment_id;
  END IF;
  
  RETURN FOUND;
END;
$$;

-- Step 8: Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own payments" ON payments;
CREATE POLICY "Users can create own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
));

DROP POLICY IF EXISTS "Admins can update all payments" ON payments;
CREATE POLICY "Admins can update all payments" ON payments FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Step 10: Grant permissions
GRANT EXECUTE ON FUNCTION create_payment_with_order TO authenticated;
GRANT EXECUTE ON FUNCTION create_payment_with_order TO service_role;
GRANT EXECUTE ON FUNCTION create_order_after_payment TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_after_payment TO service_role;
GRANT EXECUTE ON FUNCTION update_payment_status_with_order TO authenticated;
GRANT EXECUTE ON FUNCTION update_payment_status_with_order TO service_role;

-- Step 11: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Create order trigger
CREATE OR REPLACE FUNCTION update_payment_status_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When order is created or updated, ensure payment status is consistent
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.payment_id IS NOT NULL THEN
      UPDATE payments 
      SET updated_at = NOW()
      WHERE id = NEW.payment_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_payment_update_trigger ON orders;
CREATE TRIGGER orders_payment_update_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_status_trigger();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Complete payment integration fix applied successfully!';
  RAISE NOTICE '✅ All tables, indexes, functions, and policies created!';
  RAISE NOTICE '✅ Payment-order relationship established!';
  RAISE NOTICE '✅ Ready for Razorpay integration!';
END $$;
