-- Add name columns to todo_items table
-- This allows displaying "Added by" and "Completed by" similar to grocery items

-- Add created_by_name column
ALTER TABLE public.todo_items 
ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Add completed_by column (UUID of user who completed it)
ALTER TABLE public.todo_items 
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);

-- Add completed_by_name column
ALTER TABLE public.todo_items 
ADD COLUMN IF NOT EXISTS completed_by_name TEXT;
