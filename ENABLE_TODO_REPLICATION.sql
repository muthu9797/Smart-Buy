-- ⚡ ENABLE REALTIME REPLICATION FOR TODO ITEMS
-- If tasks only show up after reload, it usually means the database isn't "broadcasting" the changes.
-- This script explicitly turns on replication for the 'todo_items' table.

-- 1. Add table to publication (Supabase specific)
-- matches specific table to the 'supabase_realtime' publication
alter publication supabase_realtime add table public.todo_items;

-- 2. Grant permissions (just in case)
grant select on public.todo_items to anon;
grant select on public.todo_items to authenticated;

-- 3. Verify RLS is enabled (should be, but good to check)
alter table public.todo_items enable row level security;
