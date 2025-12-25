-- Fix RLS Policies for Messages to prevent recursion or permission issues

-- 1. Drop existing policies to be safe
drop policy if exists "Users can view messages in their family" on public.messages;
drop policy if exists "Users can insert messages to their family" on public.messages;

-- 2. Create a cleaner INSERT policy
-- We trust the client to send the correct family_id, but we verify it matches the user's profile family_id
-- AND that the user_id matches auth.uid()
create policy "Users can insert messages to their family"
  on public.messages for insert
  with check (
    -- User can only insert as themselves
    auth.uid() = user_id
    AND
    -- User must belong to the family they are messaging
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.family_id = messages.family_id
    )
  );

-- 3. Create a cleaner SELECT policy
create policy "Users can view messages in their family"
  on public.messages for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.family_id = messages.family_id
    )
  );

-- 4. Grant permissions (just in case)
grant all on public.messages to authenticated;
grant all on public.messages to service_role;
