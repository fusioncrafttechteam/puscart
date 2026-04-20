-- Add discount and code columns to offer_banners table
ALTER TABLE offer_banners ADD COLUMN discount VARCHAR(50);
ALTER TABLE offer_banners ADD COLUMN code VARCHAR(50);

-- Update existing banners with default values
UPDATE offer_banners 
SET discount = '20%', code = 'OFFER20' 
WHERE discount IS NULL OR code IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_offer_banners_active_dates ON offer_banners(is_active, start_date, end_date);

-- Update the trigger to include the new columns
DROP TRIGGER IF EXISTS update_offer_banners_updated_at ON offer_banners;
CREATE TRIGGER update_offer_banners_updated_at BEFORE UPDATE ON offer_banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
