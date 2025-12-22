-- 🛠️ IMPLEMENT MULTIPLE LISTS
-- This script creates the 'lists' table and migrates existing data.

-- 1. Create 'lists' table
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on 'lists'
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for 'lists'
DROP POLICY IF EXISTS "Users can view lists for their family" ON public.lists;
CREATE POLICY "Users can view lists for their family" ON public.lists
  FOR SELECT USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert lists for their family" ON public.lists;
CREATE POLICY "Users can insert lists for their family" ON public.lists
  FOR INSERT WITH CHECK (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete lists for their family" ON public.lists;
CREATE POLICY "Users can delete lists for their family" ON public.lists
  FOR DELETE USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

-- 4. Add 'list_id' to 'grocery_items' (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grocery_items' AND column_name = 'list_id') THEN
        ALTER TABLE public.grocery_items ADD COLUMN list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. MIGRATION: Create default 'Daily' list for all existing families
INSERT INTO public.lists (family_id, name)
SELECT DISTINCT p.family_id, 'Daily'
FROM public.profiles p
WHERE p.family_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.lists l WHERE l.family_id = p.family_id AND l.name = 'Daily'
);

-- 6. MIGRATION: Link existing items to the 'Daily' list
-- This updates items that don't have a list_id yet
UPDATE public.grocery_items gi
SET list_id = l.id
FROM public.lists l
WHERE gi.family_id = l.family_id
AND l.name = 'Daily'
AND gi.list_id IS NULL;

-- 7. Create 'Monthly' list for consistency (optional, but good for users who used the toggle)
INSERT INTO public.lists (family_id, name)
SELECT DISTINCT p.family_id, 'Monthly'
FROM public.profiles p
WHERE p.family_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.lists l WHERE l.family_id = p.family_id AND l.name = 'Monthly'
);

-- 8. (Advanced) If you want to migrate existing 'monthly' items (from the suffix hack) to the new Monthly list
-- Warning: This depends on if you actually stored 'familyId-monthly' in the database.
-- If you did, those items have a family_id like '123-monthly'. We need to fix them.
-- Strategy:
-- a. Find items where family_id ends with '-monthly'
-- b. Extract the real family_id (remove suffix)
-- c. Find the 'Monthly' list for that real family_id
-- d. Update the item's family_id to real family_id AND list_id to the Monthly list id.

DO $$
DECLARE
    r RECORD;
    real_family_id TEXT;
    monthly_list_id UUID;
BEGIN
    FOR r IN SELECT * FROM public.grocery_items WHERE family_id LIKE '%-monthly' LOOP
        -- Extract real family id (remove last 8 chars '-monthly')
        real_family_id := substring(r.family_id from 1 for length(r.family_id) - 8);
        
        -- Get the Monthly list ID for this family
        SELECT id INTO monthly_list_id FROM public.lists WHERE family_id = real_family_id AND name = 'Monthly' LIMIT 1;
        
        -- If list exists, update the item
        IF monthly_list_id IS NOT NULL THEN
            UPDATE public.grocery_items 
            SET family_id = real_family_id, list_id = monthly_list_id 
            WHERE id = r.id;
        END IF;
    END LOOP;
END $$;
