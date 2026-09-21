-- Remove Razorpay payment integration and convert to COD flow
-- This script removes payment-related tables and updates orders table for Cash on Delivery

-- Drop payments table if it exists
DROP TABLE IF EXISTS payments CASCADE;

-- Drop payment-related functions
DROP FUNCTION IF EXISTS create_payment_with_order CASCADE;
DROP FUNCTION IF EXISTS create_order_after_payment CASCADE;
DROP FUNCTION IF EXISTS verify_payment_signature CASCADE;

-- Remove payment-related columns from orders table
ALTER TABLE orders 
DROP COLUMN IF EXISTS payment_status,
DROP COLUMN IF EXISTS razorpay_order_id,
DROP COLUMN IF EXISTS razorpay_payment_id,
DROP COLUMN IF EXISTS razorpay_signature,
DROP COLUMN IF EXISTS payment_id;

-- Add payment_method column if it doesn't exist (default to COD)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'COD';
    END IF;
END $$;

-- Ensure order_status column exists and has proper values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- Update existing orders to have COD as payment method
UPDATE orders SET payment_method = 'COD' WHERE payment_method IS NULL;

-- Update existing orders to have proper order status
UPDATE orders SET order_status = 'pending' WHERE order_status IS NULL;

-- Remove payment-related indexes
DROP INDEX IF EXISTS idx_payments_user_id;
DROP INDEX IF EXISTS idx_payments_razorpay_order_id;
DROP INDEX IF EXISTS idx_orders_payment_status;

-- Add new indexes for COD flow
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON orders(user_id, order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Remove payment-related RLS policies if they exist
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON payments;

-- Update orders RLS policies to work with new structure
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Remove payment-related sequences
DROP SEQUENCE IF EXISTS payments_id_seq CASCADE;

-- Clean up any orphaned payment-related data
DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);

-- Update order_items table structure if needed
DO $$
BEGIN
    -- Ensure order_items has proper foreign key constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_order_id_fkey'
        AND table_name = 'order_items'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create a simple function to get user orders with items (replaces complex payment-related functions)
CREATE OR REPLACE FUNCTION get_user_orders_with_items(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    total_amount DECIMAL,
    order_status VARCHAR,
    payment_method VARCHAR,
    delivery_address TEXT,
    phone VARCHAR,
    delivery_address_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    products JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.user_id,
        o.total_amount,
        o.order_status,
        o.payment_method,
        o.delivery_address,
        o.phone,
        o.delivery_address_id,
        o.created_at,
        o.updated_at,
        o.products
    FROM orders o
    WHERE o.user_id = user_id_param
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_orders_with_items TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;

-- Add helpful comments
COMMENT ON TABLE orders IS 'Orders table for COD flow - payment_method defaults to COD';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: COD for Cash on Delivery';
COMMENT ON COLUMN orders.order_status IS 'Order status: pending, processing, shipped, delivered, cancelled';

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Payment integration removed successfully. Orders table now uses COD flow.';
END $$;
