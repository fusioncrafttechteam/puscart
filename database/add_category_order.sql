-- Add order column to categories table
ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0;

-- Update existing categories to have sequential order based on creation date
UPDATE categories 
SET display_order = (
  SELECT row_number - 1 
  FROM (
    SELECT id, row_number() OVER (ORDER BY created_at) as row_number
    FROM categories
  ) numbered 
  WHERE numbered.id = categories.id
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order);

-- Update the trigger to include the new column
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
