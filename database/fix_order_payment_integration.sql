-- ========================================
-- FIX ORDER-PAYMENT INTEGRATION ISSUES
-- ========================================
-- This script fixes the complete order-payment flow
-- and ensures all database relationships work correctly

-- Step 1: Ensure orders table has all required columns
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

-- Step 2: Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Step 3: Fix the create_order_after_payment function
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
  -- Lock the payment record to prevent race conditions
  SELECT * INTO payment_record 
  FROM payments 
  WHERE id = p_payment_id AND user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found or access denied';
  END IF;
  
  -- Check payment status
  IF payment_record.status != 'paid' AND payment_record.status != 'processing' THEN
    RAISE EXCEPTION 'Payment must be verified before creating order';
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

-- Step 4: Create a function to handle payment status updates
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

-- Step 5: Create function to get order with payment details
CREATE OR REPLACE FUNCTION get_order_with_payment(p_order_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  total_amount DECIMAL(10,2),
  payment_status VARCHAR(20),
  delivery_status VARCHAR(20),
  delivery_address TEXT,
  phone VARCHAR(20),
  delivery_address_id UUID,
  products JSONB,
  payment_id UUID,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  payment_amount DECIMAL(10,2),
  payment_status_detail VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.user_id,
    o.total_amount,
    o.payment_status,
    o.delivery_status,
    o.delivery_address,
    o.phone,
    o.delivery_address_id,
    o.products,
    o.payment_id,
    p.razorpay_order_id,
    p.razorpay_payment_id,
    p.amount as payment_amount,
    p.status as payment_status_detail,
    o.created_at,
    o.updated_at
  FROM orders o
  LEFT JOIN payments p ON o.payment_id = p.id
  WHERE o.id = p_order_id AND o.user_id = p_user_id;
END;
$$;

-- Step 6: Grant proper permissions
GRANT EXECUTE ON FUNCTION create_order_after_payment TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_after_payment TO service_role;
GRANT EXECUTE ON FUNCTION update_payment_status_with_order TO authenticated;
GRANT EXECUTE ON FUNCTION update_payment_status_with_order TO service_role;
GRANT EXECUTE ON FUNCTION get_order_with_payment TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_with_payment TO service_role;

-- Step 7: Create trigger to automatically update payment status
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

-- Apply trigger
DROP TRIGGER IF EXISTS orders_payment_update_trigger ON orders;
CREATE TRIGGER orders_payment_update_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_status_trigger();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Order-Payment integration fixed successfully!';
  RAISE NOTICE 'All functions and triggers created/updated!';
  RAISE NOTICE 'Database relationships are now properly established!';
END $$;
