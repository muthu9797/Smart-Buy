-- ⚡ PERFORMANCE RLS (JWT METADATA)
-- The "Connection Closed" error often happens because looking up the 'profiles' table is too slow for Realtime.
-- This script changes the security to check your user_metadata directly (Zero-Lookup).

-- 1. Reset Policies
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can view todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can update todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can delete todo items for their family" ON public.todo_items;

-- 2. Create JWT-Based Policies (Ultra Fast)
-- NOTE: This assumes your user has 'family_id' in their metadata (which we verified).

-- INSERT: Check if new row's family_id matches your metadata
CREATE POLICY "Users can insert todo items for their family"
ON public.todo_items FOR INSERT
WITH CHECK (
  family_id = (select auth.jwt() -> 'user_metadata' ->> 'family_id')
);

-- SELECT: Only show rows matching your metadata
CREATE POLICY "Users can view todo items for their family"
ON public.todo_items FOR SELECT
USING (
  family_id = (select auth.jwt() -> 'user_metadata' ->> 'family_id')
);

-- UPDATE:
CREATE POLICY "Users can update todo items for their family"
ON public.todo_items FOR UPDATE
USING (
  family_id = (select auth.jwt() -> 'user_metadata' ->> 'family_id')
);

-- DELETE:
CREATE POLICY "Users can delete todo items for their family"
ON public.todo_items FOR DELETE
USING (
  family_id = (select auth.jwt() -> 'user_metadata' ->> 'family_id')
);
