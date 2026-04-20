-- Add discount_percentage column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

-- Add comment to describe the column
COMMENT ON COLUMN products.discount_percentage IS 'Discount percentage for the product (0-100). 0 means no discount.';
