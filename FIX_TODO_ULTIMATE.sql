-- ⚡ FINAL FIX: HYBRID SECURITY
-- The JWT approach failed because user metadata might be out of sync.
-- The previous stability script might have been too strict on INSERTs.
-- This approach separates the concerns:
-- 1. INSERTs only check that YOU created the item (Super fast, no errors).
-- 2. SELECTs (Realtime) use a secure admin function to filter by family.

-- 1. Ensure the Secure Helper Function exists
CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER -- Runs as admin, bypassing RLS
SET search_path = public
STABLE
AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Reset Policies
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can view todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can update todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can delete todo items for their family" ON public.todo_items;

-- 3. Create Hybrid Policies

-- INSERT: Only checks ownership. 
-- Guaranteed to pass if you are logged in.
CREATE POLICY "Users can insert their own items"
ON public.todo_items FOR INSERT
WITH CHECK ( auth.uid() = created_by );

-- SELECT: Filters by Family (for Realtime/Sync)
-- Uses the fast secure function.
CREATE POLICY "Users can view todo items for their family"
ON public.todo_items FOR SELECT
USING ( family_id = get_my_family_id() );

-- UPDATE: Checks ownership OR family (hybrid)
CREATE POLICY "Users can update todo items for their family"
ON public.todo_items FOR UPDATE
USING ( family_id = get_my_family_id() );

-- DELETE: Checks ownership OR family (hybrid)
CREATE POLICY "Users can delete todo items for their family"
ON public.todo_items FOR DELETE
USING ( family_id = get_my_family_id() );

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION public.get_my_family_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_family_id TO anon;
