-- 🛠️ FIX TODO RLS (PERSONAL MODE)
-- To resolve the persistent permission errors ("new row violates..."), 
-- we are switching the security model to be strictly USER-BASED.
-- This means each user sees only their OWN items. This avoids confusing family lookups.

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

-- 3. INSERT POLICY (Check Owner)
CREATE POLICY "Users can insert their own items"
ON public.todo_items FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 4. SELECT POLICY (Check Owner)
CREATE POLICY "Users can view their own items"
ON public.todo_items FOR SELECT
USING (auth.uid() = created_by);

-- 5. UPDATE POLICY (Check Owner)
CREATE POLICY "Users can update their own items"
ON public.todo_items FOR UPDATE
USING (auth.uid() = created_by);

-- 6. DELETE POLICY (Check Owner)
CREATE POLICY "Users can delete their own items"
ON public.todo_items FOR DELETE
USING (auth.uid() = created_by);

-- 7. Grant Permissions
GRANT ALL ON public.todo_items TO authenticated;
GRANT ALL ON public.todo_items TO anon;
