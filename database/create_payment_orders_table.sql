-- Enable Row Level Security
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own payment orders" ON payment_orders;
DROP POLICY IF EXISTS "Users can insert their own payment orders" ON payment_orders;
DROP POLICY IF EXISTS "Users can update their own payment orders" ON payment_orders;

-- Create RLS policies
CREATE POLICY "Users can view their own payment orders"
    ON payment_orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment orders"
    ON payment_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment orders"
    ON payment_orders FOR UPDATE
    USING (auth.uid() = user_id);
