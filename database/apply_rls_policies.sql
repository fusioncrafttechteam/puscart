-- Comprehensive RLS Policies for all tables
-- This ensures all Row Level Security policies are correctly applied

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can create own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

DROP POLICY IF EXISTS "Users can view own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can create own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON user_addresses;

-- Enable RLS on all tables (in case it was disabled)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- Cart Items RLS Policies
CREATE POLICY "Users can view own cart items" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cart items" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart items" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart items" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- Orders RLS Policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- User Addresses RLS Policies
CREATE POLICY "Users can view own addresses" ON user_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own addresses" ON user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON user_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON user_addresses FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON cart_items TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON user_addresses TO authenticated;

-- Grant select permissions to public for products and categories (read-only access)
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON offer_banners TO anon;
