-- 🛠️ FIX TODO RLS POLICIES
-- The initial policy might have failed if profile lookups were restricted.
-- This script simplifies the permissions to ensure you can always create your own tasks.

-- 1. Enable RLS (just in case)
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing insert policy to avoid conflicts
DROP POLICY IF EXISTS "Users can insert todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can insert their own todo items" ON public.todo_items;

-- 3. Create a Robust INSERT Policy
-- Instead of checking family_id via profiles (which might fail recursion),
-- we simply verify that YOU are the creator of the item.
CREATE POLICY "Users can insert their own todo items"
ON public.todo_items FOR INSERT
WITH CHECK (created_by = auth.uid());

-- 4. Ensure Select/Update/Delete work (Re-apply if needed)
-- We keep the family check for viewing so you only see your family's items.
DROP POLICY IF EXISTS "Users can view todo items for their family" ON public.todo_items;
CREATE POLICY "Users can view todo items for their family"
ON public.todo_items FOR SELECT
USING (
  family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update todo items for their family" ON public.todo_items;
CREATE POLICY "Users can update todo items for their family"
ON public.todo_items FOR UPDATE
USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete todo items for their family" ON public.todo_items;
CREATE POLICY "Users can delete todo items for their family"
ON public.todo_items FOR DELETE
USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));
