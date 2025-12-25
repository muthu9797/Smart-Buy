-- 🛠️ FIX TODO RLS (FINAL SHARED MODE)
-- The goal is to allow access based on FAMILY_ID (Shared List), just like the Grocery List.
-- The previous error likely occurred because the database Policy couldn't read the 'profiles' table to verify your family.

-- 1. Ensure 'profiles' is readable (Critical for the checks below to work)
-- We add a policy to ensure you can read your own profile to check your family_id.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- 2. Reset To-Do Policies
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON public.todo_items; -- cleanup personal policy
DROP POLICY IF EXISTS "Users can view todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can view their own items" ON public.todo_items; -- cleanup personal policy
DROP POLICY IF EXISTS "Users can update todo items for their family" ON public.todo_items;
DROP POLICY IF EXISTS "Users can delete todo items for their family" ON public.todo_items;

-- 3. Create SHARED (Family) Policies

-- INSERT: verify the family_id matches YOUR profile's family_id
CREATE POLICY "Users can insert todo items for their family"
ON public.todo_items FOR INSERT
WITH CHECK (
  family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid())
);

-- SELECT: view items belonging to your family
CREATE POLICY "Users can view todo items for their family"
ON public.todo_items FOR SELECT
USING (
  family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid())
);

-- UPDATE: update items belonging to your family
CREATE POLICY "Users can update todo items for their family"
ON public.todo_items FOR UPDATE
USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

-- DELETE: delete items belonging to your family
CREATE POLICY "Users can delete todo items for their family"
ON public.todo_items FOR DELETE
USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

-- 4. Grant Permissions
GRANT ALL ON public.todo_items TO authenticated;
GRANT ALL ON public.todo_items TO anon;
