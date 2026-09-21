-- ========================================
-- PAYMENTS TABLE FOR RAZORPAY INTEGRATION
-- ========================================

-- Create payments table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
));
CREATE POLICY "Admins can update all payments" ON payments FOR UPDATE USING (EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Add payment_id column to orders table for proper relationship
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

-- Create index for the new payment_id column
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- Function to create payment with order
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

-- Function to verify and update payment
CREATE OR REPLACE FUNCTION verify_and_update_payment(
  p_payment_id UUID,
  p_razorpay_payment_id VARCHAR(255),
  p_razorpay_signature TEXT,
  p_status VARCHAR(20) DEFAULT 'paid'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Update payment with verification details
  UPDATE payments 
  SET 
    razorpay_payment_id = p_razorpay_payment_id,
    razorpay_signature = p_razorpay_signature,
    status = p_status,
    updated_at = NOW()
  WHERE id = p_payment_id 
  AND user_id = current_user_id;
  
  -- Check if update was successful
  RETURN FOUND;
END;
$$;

-- Function to create order after successful payment
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
BEGIN
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
    p_products,
    p_payment_id
  )
  RETURNING id INTO order_id;
  
  -- Update payment status to paid
  UPDATE payments 
  SET status = 'paid',
      updated_at = NOW()
  WHERE id = p_payment_id;
  
  RETURN order_id;
END;
$$;

-- Grant execute permissions to functions
GRANT EXECUTE ON FUNCTION create_payment_with_order TO authenticated;
GRANT EXECUTE ON FUNCTION verify_and_update_payment TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_after_payment TO authenticated;
GRANT EXECUTE ON FUNCTION create_payment_with_order TO service_role;
GRANT EXECUTE ON FUNCTION verify_and_update_payment TO service_role;
GRANT EXECUTE ON FUNCTION create_order_after_payment TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Payments table created successfully!';
  RAISE NOTICE 'Razorpay integration functions created!';
  RAISE NOTICE 'Payment-order relationship established!';
END $$;
