-- Add boolean columns to products table for homepage sections
ALTER TABLE products
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS best_selling BOOLEAN DEFAULT FALSE;
