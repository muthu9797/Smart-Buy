-- 🛠️ Safe Add Quantity Column
-- This script checks if the 'quantity' column exists before trying to add it.
-- It avoids "column already exists" errors.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'grocery_items' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE grocery_items ADD COLUMN quantity TEXT DEFAULT '1';
    END IF;
END $$;

-- Update existing items to have a default quantity if null
UPDATE grocery_items 
SET quantity = '1' 
WHERE quantity IS NULL;
