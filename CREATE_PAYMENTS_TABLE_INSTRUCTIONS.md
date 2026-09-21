# IMPORTANT: Create Payments Table in Supabase

The Razorpay payment integration is failing because the `payments` table doesn't exist in the database.

## Steps to Fix:

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/tjgklvdmuxnlydwwchso/sql

2. **Execute the following SQL:**
   (Copy the contents from `database/create_payments_table.sql`)

```sql
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
```

3. **After creating the table:**
   - Uncomment the database code in both Edge Functions:
     - `supabase/functions/razorpay-order/index.ts` (lines 101-117)
     - `supabase/functions/razorpay-verify/index.ts` (lines 117-136)
   - Redeploy both functions

## Current Status:
✅ Edge Functions deployed without database dependency
⚠️ Payments table needs to be created manually
🔄 Payment flow will work but won't store records until table is created

## Test the Fix:
After deploying the updated functions, the payment flow should work without the 500 error.
