-- Add Razorpay payment columns to orders table
ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN razorpay_payment_id TEXT;

-- Update payment_status check constraint to include 'failed' status (already exists)
-- The existing constraint already includes all needed values: 'pending', 'paid', 'failed', 'refunded'

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);
