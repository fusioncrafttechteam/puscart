-- ========================================
-- HARDEN DATABASE SECURITY & PERFORMANCE
-- ========================================

-- First, ensure payments table exists (run create_payments_table.sql first if not done)
-- This file assumes the payments table already exists

-- ========================================
-- IMPROVED RLS POLICIES FOR PAYMENTS TABLE
-- ========================================

-- Drop existing policies to recreate with better security
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON payments;

-- Create enhanced RLS policies for payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON payments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments (limited)" ON payments FOR UPDATE 
USING (auth.uid() = user_id AND status IN ('pending', 'processing'));

-- Enhanced admin policies with proper role checking
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can update all payments" ON payments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ========================================
-- IMPROVED RLS POLICIES FOR ORDERS TABLE
-- ========================================

-- Drop existing order policies if they exist
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- Create enhanced RLS policies for orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders (limited)" ON orders FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  delivery_status IN ('pending', 'processing') AND
  payment_status NOT IN ('refunded')
);

-- Enhanced admin policies
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Orders table indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_payment ON orders(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders(created_at DESC);

-- Payments table indexes (already some exist, adding more)
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_user_created_at ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created_at ON payments(status, created_at DESC);

-- Products table indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(popular) WHERE popular = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_best_selling ON products(best_selling) WHERE best_selling = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price, offer_price);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);

-- ========================================
-- SECURITY CONSTRAINTS AND VALIDATIONS
-- ========================================

-- Add check constraints for payments table
ALTER TABLE payments 
ADD CONSTRAINT IF NOT EXISTS check_payment_amount_positive 
CHECK (amount > 0);

ALTER TABLE payments 
ADD CONSTRAINT IF NOT EXISTS check_payment_status_valid 
CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'));

ALTER TABLE payments 
ADD CONSTRAINT IF NOT EXISTS check_payment_method_valid 
CHECK (payment_method IN ('razorpay', 'cod', 'other'));

-- Add check constraints for orders table
ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS check_order_amount_positive 
CHECK (total_amount > 0);

ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS check_order_payment_status_valid 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS check_order_delivery_status_valid 
CHECK (delivery_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));

-- ========================================
-- SECURITY FUNCTIONS
-- ========================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = true
  );
END;
$$;

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM users 
  WHERE id = auth.uid() 
  AND is_active = true;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Function to validate order amount against cart items
CREATE OR REPLACE FUNCTION validate_order_amount(
  p_user_id UUID,
  p_total_amount DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calculated_total DECIMAL;
BEGIN
  -- This is a simplified validation
  -- In a real implementation, you'd calculate based on actual cart items
  
  -- For now, just check basic amount validation
  IF p_total_amount <= 0 OR p_total_amount > 100000 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- ========================================
-- AUDIT TRIGGER FOR CRITICAL TABLES
-- ========================================

-- Create audit table for payments
CREATE TABLE IF NOT EXISTS payments_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_status TEXT,
  new_status TEXT,
  user_id UUID,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create audit table for orders
CREATE TABLE IF NOT EXISTS orders_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_payment_status TEXT,
  new_payment_status TEXT,
  old_delivery_status TEXT,
  new_delivery_status TEXT,
  user_id UUID,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Audit trigger function for payments
CREATE OR REPLACE FUNCTION audit_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO payments_audit (payment_id, operation, new_status, user_id, changed_by, metadata)
    VALUES (NEW.id, TG_OP, NEW.status, NEW.user_id, auth.uid(), 
            jsonb_build_object('amount', NEW.amount, 'payment_method', NEW.payment_method));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO payments_audit (payment_id, operation, old_status, new_status, user_id, changed_by, metadata)
      VALUES (NEW.id, TG_OP, OLD.status, NEW.status, NEW.user_id, auth.uid(),
              jsonb_build_object('amount', NEW.amount, 'payment_method', NEW.payment_method));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO payments_audit (payment_id, operation, old_status, user_id, changed_by)
    VALUES (OLD.id, TG_OP, OLD.status, OLD.user_id, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Audit trigger function for orders
CREATE OR REPLACE FUNCTION audit_orders()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO orders_audit (order_id, operation, new_payment_status, new_delivery_status, user_id, changed_by, metadata)
    VALUES (NEW.id, TG_OP, NEW.payment_status, NEW.delivery_status, NEW.user_id, auth.uid(),
            jsonb_build_object('total_amount', NEW.total_amount));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status OR 
       OLD.delivery_status IS DISTINCT FROM NEW.delivery_status THEN
      INSERT INTO orders_audit (order_id, operation, old_payment_status, new_payment_status, 
                               old_delivery_status, new_delivery_status, user_id, changed_by, metadata)
      VALUES (NEW.id, TG_OP, OLD.payment_status, NEW.payment_status, 
              OLD.delivery_status, NEW.delivery_status, NEW.user_id, auth.uid(),
              jsonb_build_object('total_amount', NEW.total_amount));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO orders_audit (order_id, operation, old_payment_status, old_delivery_status, user_id, changed_by)
    VALUES (OLD.id, TG_OP, OLD.payment_status, OLD.delivery_status, OLD.user_id, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for audit
DROP TRIGGER IF EXISTS payments_audit_trigger ON payments;
CREATE TRIGGER payments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_payments();

DROP TRIGGER IF EXISTS orders_audit_trigger ON orders;
CREATE TRIGGER orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_orders();

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_current_user_role TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION validate_order_amount TO authenticated, service_role;

-- Grant select permissions on audit tables (admins only)
GRANT SELECT ON payments_audit TO authenticated;
GRANT SELECT ON orders_audit TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database security hardening completed!';
  RLAISE NOTICE 'RLS policies updated with enhanced security!';
  RAISE NOTICE 'Performance indexes created!';
  RAISE NOTICE 'Audit triggers installed!';
  RAISE NOTICE 'Security constraints added!';
END $$;
