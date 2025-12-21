-- 🛠️ FIX: Update RLS Policies to allow Monthly Lists
-- The previous policies only allowed strict family_id matching.
-- This update allows family_id OR family_id + '-monthly'

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view items from their family" ON grocery_items;
DROP POLICY IF EXISTS "Users can insert items for their family" ON grocery_items;
DROP POLICY IF EXISTS "Users can update items from their family" ON grocery_items;
DROP POLICY IF EXISTS "Users can delete items from their family" ON grocery_items;

-- 2. Create new flexible policies

-- SELECT
CREATE POLICY "Users can view items from their family"
  ON grocery_items FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
    OR
    family_id IN (
      SELECT family_id || '-monthly' FROM profiles WHERE id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Users can insert items for their family"
  ON grocery_items FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
    OR
    family_id IN (
      SELECT family_id || '-monthly' FROM profiles WHERE id = auth.uid()
    )
  );

-- UPDATE
CREATE POLICY "Users can update items from their family"
  ON grocery_items FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
    OR
    family_id IN (
      SELECT family_id || '-monthly' FROM profiles WHERE id = auth.uid()
    )
  );

-- DELETE
CREATE POLICY "Users can delete items from their family"
  ON grocery_items FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
    OR
    family_id IN (
      SELECT family_id || '-monthly' FROM profiles WHERE id = auth.uid()
    )
  );
