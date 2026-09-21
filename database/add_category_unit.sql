-- Add unit column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'g';

-- Update existing categories with default units based on category name
UPDATE categories 
SET unit = CASE 
    WHEN LOWER(name) LIKE '%fruit%' OR LOWER(name) LIKE '%பழங்கள்%' THEN 'kg'
    WHEN LOWER(name) LIKE '%vegetable%' OR LOWER(name) LIKE '%காய்கறிகள்%' THEN 'kg'
    WHEN LOWER(name) LIKE '%cereal%' OR LOWER(name) LIKE '%grain%' THEN 'kg'
    WHEN LOWER(name) LIKE '%pulse%' THEN 'kg'
    WHEN LOWER(name) LIKE '%cleansing%' OR LOWER(name) LIKE '%cleaning%' THEN 'pcs'
    WHEN LOWER(name) LIKE '%milk%' OR LOWER(name) LIKE '%liquid%' THEN 'L'
    ELSE 'g'
END
WHERE unit IS NULL OR unit = 'g';
