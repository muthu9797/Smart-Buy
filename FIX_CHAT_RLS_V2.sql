-- FIX CHAT RLS V2: Simplified Policy
-- Removes the check against 'profiles' table for INSERT to rule out join recursion/permission issues.
-- We still ensure the user is inserting as themselves.

-- 1. Drop previous policies
drop policy if exists "Users can view messages in their family" on public.messages;
drop policy if exists "Users can insert messages to their family" on public.messages;

-- 2. Simplified INSERT Policy
-- Only check that the user_id matches the authenticated user.
-- We trust the client to send the correct family_id for now (or until we fix profile lookup).
create policy "Users can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = user_id
  );

-- 3. Simplified SELECT Policy
-- Allow users to see messages where the family_id matches their profile's family_id.
-- This one is usually safe, but let's make it robust.
create policy "Users can view messages"
  on public.messages for select
  using (
    -- Direct check against profile
    family_id in (
      select family_id from public.profiles where id = auth.uid()
    )
  );

-- 4. Ensure Permissions
grant all on public.messages to authenticated;
grant all on public.messages to service_role;
