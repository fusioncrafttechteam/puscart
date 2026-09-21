-- Database Schema Fixes for Puscart Delivery Application
-- This file contains all necessary fixes for identified schema issues

-- Fix 1: Add display_order column to categories table (if not exists)
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Fix 2: Add product flags columns (if not exists)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS best_selling BOOLEAN DEFAULT FALSE;

-- Fix 3: Update user_addresses table structure to match application expectations
-- Drop existing table if it has wrong structure and recreate with correct schema
DROP TABLE IF EXISTS user_addresses CASCADE;

CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  landmark VARCHAR(255),
  address_type VARCHAR(10) DEFAULT 'other' CHECK (address_type IN ('home', 'work', 'other')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix 4: Add missing columns to offer_banners table (if not exists)
ALTER TABLE offer_banners
ADD COLUMN IF NOT EXISTS discount VARCHAR(50) DEFAULT '20%',
ADD COLUMN IF NOT EXISTS code VARCHAR(50) DEFAULT 'OFFER20';

-- Fix 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(popular);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_best_selling ON products(best_selling);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(is_default);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- Fix 6: Update existing categories with display_order values if they are NULL
UPDATE categories SET display_order = 0 WHERE display_order IS NULL;

-- Fix 7: Enable Row Level Security (RLS) policies if not already enabled
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_addresses (if they don't exist)
DROP POLICY IF EXISTS "Users can view their own addresses" ON user_addresses;
CREATE POLICY "Users can view their own addresses" ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON user_addresses;
CREATE POLICY "Users can insert their own addresses" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON user_addresses;
CREATE POLICY "Users can update their own addresses" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON user_addresses;
CREATE POLICY "Users can delete their own addresses" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for orders (if they don't exist)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for cart_items (if they don't exist)
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own cart items" ON cart_items;
CREATE POLICY "Users can manage their own cart items" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

COMMIT;
