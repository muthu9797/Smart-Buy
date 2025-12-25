-- ⚡ ALLOW SELF-UPDATES
-- If the Family ID lookup fails, you should still be able to update your OWN items.
-- This adds a fallback policy for UPDATE and DELETE.

-- 1. Update Policy (Hybrid OR)
DROP POLICY IF EXISTS "Users can update todo items for their family" ON public.todo_items;

CREATE POLICY "Users can update todo items for their family"
ON public.todo_items FOR UPDATE
USING ( 
  family_id = get_my_family_id() 
  OR 
  created_by = auth.uid() 
);

-- 2. Delete Policy (Hybrid OR)
DROP POLICY IF EXISTS "Users can delete todo items for their family" ON public.todo_items;

CREATE POLICY "Users can delete todo items for their family"
ON public.todo_items FOR DELETE
USING ( 
  family_id = get_my_family_id() 
  OR 
  created_by = auth.uid() 
);
