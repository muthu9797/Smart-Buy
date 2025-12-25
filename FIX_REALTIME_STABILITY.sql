-- ⚡ FIX REALTIME STABILITY (SECURITY DEFINER)
-- The Realtime connection is closing because the previous RLS policy was too "heavy" or caused permission loops.
-- We fix this by creating a secure helper function that gets your family_id efficiently.

-- 1. Create a Secure Function to get Family ID
-- "SECURITY DEFINER" means this function runs with admin privileges, 
-- bypassing any RLS blocks on the 'profiles' table.
CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Reset Todo Policies to use this Function
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable All Access for Authenticated Users" ON public.todo_items;
DROP POLICY IF EXISTS "Users can insert todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can view todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can update todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can delete todo items for their family" ON public.todo_items;

-- 3. Apply Fast Policies
-- These policies use the helper function, which is much faster/safer for Realtime.

CREATE POLICY "Users can insert todo items for their family"
ON public.todo_items FOR INSERT
WITH CHECK ( family_id = get_my_family_id() );

CREATE POLICY "Users can view todo items for their family"
ON public.todo_items FOR SELECT
USING ( family_id = get_my_family_id() );

CREATE POLICY "Users can update todo items for their family"
ON public.todo_items FOR UPDATE
USING ( family_id = get_my_family_id() );

CREATE POLICY "Users can delete todo items for their family"
ON public.todo_items FOR DELETE
USING ( family_id = get_my_family_id() );

-- 4. Grant Execute on Function
GRANT EXECUTE ON FUNCTION public.get_my_family_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_family_id TO anon;
