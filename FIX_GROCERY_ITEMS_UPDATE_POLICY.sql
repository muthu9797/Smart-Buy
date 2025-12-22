-- 🛠️ FIX GROCERY ITEMS UPDATE POLICY
-- The grocery_items table needs an explicit UPDATE policy to allow marking items as bought/unbought.

-- 1. Create UPDATE policy for 'grocery_items'
DROP POLICY IF EXISTS "Users can update grocery_items for their family" ON public.grocery_items;

CREATE POLICY "Users can update grocery_items for their family" ON public.grocery_items
  FOR UPDATE 
  USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

-- Note: This ensures users can only update items belonging to their family.
