-- 🛠️ ADD LOCK TO LISTS
-- This script adds an 'is_locked' column to the 'lists' table.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lists' 
        AND column_name = 'is_locked'
    ) THEN
        ALTER TABLE public.lists ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
