-- 🛠️ FIX LISTS UPDATE POLICY
-- The previous script missed the UPDATE policy, preventing locking/unlocking.

-- 1. Create UPDATE policy for 'lists'
DROP POLICY IF EXISTS "Users can update lists for their family" ON public.lists;
CREATE POLICY "Users can update lists for their family" ON public.lists
  FOR UPDATE USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

-- Note: The 'USING' clause checks if the existing row is accessible.
-- The 'WITH CHECK' clause ensures the new row state is valid.
