-- 🛠️ FIX TODO RLS POLICIES V2 (NUCLEAR OPTION)
-- We are dropping everything and recreating policies from scratch to ensure no conflicts.

-- 1. Reset
ALTER TABLE public.todo_items DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can insert their own todo items" ON public.todo_items;
DROP POLICY IF EXISTS "Enable All Access for Authenticated Users" ON public.todo_items;
DROP POLICY IF EXISTS "Users can view todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can update todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can delete todo items for their family" ON public.todo_items;

-- 2. Re-enable RLS
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;

-- 3. INSERT POLICY (Simpler Check)
-- Validates that the user inserting the row is the 'created_by' user.
CREATE POLICY "Users can insert their own todo items"
ON public.todo_items FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 4. SELECT POLICY
-- Matches family_id. This is standard and should work for viewing.
CREATE POLICY "Users can view todo items for their family"
ON public.todo_items FOR SELECT
USING (
  family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid())
);

-- 5. UPDATE POLICY
-- Matches family_id.
CREATE POLICY "Users can update todo items for their family"
ON public.todo_items FOR UPDATE
USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

-- 6. DELETE POLICY
-- Matches family_id.
CREATE POLICY "Users can delete todo items for their family"
ON public.todo_items FOR DELETE
USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

-- 7. Grant Permissions (Just in case)
GRANT ALL ON public.todo_items TO authenticated;
GRANT ALL ON public.todo_items TO anon;
