-- Performance Indexes for All Tables
-- This ensures optimal query performance for the ecommerce application

-- Cart Items Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at);

-- Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

-- Order Items Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id);

-- Products Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(popular) WHERE popular = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_best_selling ON products(best_selling) WHERE best_selling = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock) WHERE stock > 0;

-- Categories Indexes
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);

-- User Addresses Indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON user_addresses(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_user_addresses_postal_code ON user_addresses(postal_code);
CREATE INDEX IF NOT EXISTS idx_user_addresses_city ON user_addresses(city);
CREATE INDEX IF NOT EXISTS idx_user_addresses_state ON user_addresses(state);

-- Offer Banners Indexes
CREATE INDEX IF NOT EXISTS idx_offer_banners_is_active ON offer_banners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offer_banners_created_at ON offer_banners(created_at);

-- Composite Indexes for Common Queries
-- For fetching user's cart with product details
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product_details ON cart_items(user_id, product_id, created_at);

-- For user order history
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created ON orders(user_id, payment_status, created_at DESC);

-- For order fulfillment
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status_created ON orders(delivery_status, created_at);

-- For product browsing by category
CREATE INDEX IF NOT EXISTS idx_products_category_active_price ON products(category_id, is_active, price);

-- For homepage product sections
CREATE INDEX IF NOT EXISTS idx_products_popular_active ON products(popular, is_active) WHERE popular = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured_active ON products(featured, is_active) WHERE featured = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_best_selling_active ON products(best_selling, is_active) WHERE best_selling = true AND is_active = true;
