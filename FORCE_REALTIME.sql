-- ⚡ FORCE REALTIME SETTINGS
-- It seems the "INSERT" events aren't reaching other users.
-- We need to ensure the database publishes these events fully.

-- 1. Set Replica Identity to FULL (Records all columns for updates/deletes)
ALTER TABLE public.todo_items REPLICA IDENTITY FULL;

-- 2. Explicitly add to publication again
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.grocery_items, public.todo_items, public.lists;
-- Note: Recreating it ensures 'todo_items' is definitely included. 
-- Warning: This might reset existing listeners for a brief moment.

-- 3. Just in case, ensure RLS allows read (we did this, but good to be sure)
-- (The existing policies from FIX_TODO_RLS_FINAL.sql are good)

-- 4. Grant access to 'postgres' role (sometimes needed for replication)
GRANT SELECT ON public.todo_items TO postgres;
