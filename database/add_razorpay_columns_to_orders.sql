-- Add Razorpay payment columns to orders table
-- This migration adds the necessary columns to store Razorpay payment information

-- Add razorpay_order_id column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- Add razorpay_payment_id column  
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);

-- Add comments for documentation
COMMENT ON COLUMN orders.razorpay_order_id IS 'Razorpay order ID for payment tracking';
COMMENT ON COLUMN orders.razorpay_payment_id IS 'Razorpay payment ID for payment tracking';
