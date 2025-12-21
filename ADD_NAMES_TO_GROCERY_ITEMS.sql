-- Add added_by_name column
ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS added_by_name TEXT;

-- Add bought_by_name column
ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS bought_by_name TEXT;

-- Backfill data from profiles for items that don't have names yet
UPDATE grocery_items
SET added_by_name = profiles.full_name
FROM profiles
WHERE grocery_items.added_by = profiles.id
AND grocery_items.added_by_name IS NULL
AND profiles.full_name IS NOT NULL;

UPDATE grocery_items
SET bought_by_name = profiles.full_name
FROM profiles
WHERE grocery_items.bought_by = profiles.id
AND grocery_items.bought_by_name IS NULL
AND profiles.full_name IS NOT NULL;
