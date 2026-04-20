-- Add unit column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

-- Update existing products with default units based on category
UPDATE products 
SET unit = CASE 
    WHEN LOWER(c.name) LIKE '%fruit%' THEN 'kg'
    WHEN LOWER(c.name) LIKE '%vegetable%' THEN 'kg'
    WHEN LOWER(c.name) LIKE '%cereal%' OR LOWER(c.name) LIKE '%grain%' THEN 'kg'
    WHEN LOWER(c.name) LIKE '%pulse%' THEN 'kg'
    WHEN LOWER(c.name) LIKE '%cleansing%' OR LOWER(c.name) LIKE '%cleaning%' THEN 'pcs'
    WHEN LOWER(c.name) LIKE '%milk%' OR LOWER(c.name) LIKE '%liquid%' THEN 'L'
    ELSE 'g'
END
FROM categories c 
WHERE products.category_id = c.id AND products.unit IS NULL;
