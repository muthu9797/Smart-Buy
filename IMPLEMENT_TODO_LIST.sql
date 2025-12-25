-- Create todo_items table
create table public.todo_items (
  id uuid default gen_random_uuid() primary key,
  family_id text not null,
  text text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),
  completed_at timestamp with time zone,
  due_date timestamp with time zone
);

-- Enable RLS
alter table public.todo_items enable row level security;

-- Policies (same pattern as grocery_items)

-- View policies
create policy "Users can view todo items for their family"
on public.todo_items for select
using (
  family_id in (
    select family_id from public.profiles 
    where id = auth.uid()
  )
);

-- Insert policies
create policy "Users can insert todo items for their family"
on public.todo_items for insert
with check (
  family_id in (
    select family_id from public.profiles 
    where id = auth.uid()
  )
);

-- Update policies
create policy "Users can update todo items for their family"
on public.todo_items for update
using (
  family_id in (
    select family_id from public.profiles 
    where id = auth.uid()
  )
);

-- Delete policies
create policy "Users can delete todo items for their family"
on public.todo_items for delete
using (
  family_id in (
    select family_id from public.profiles 
    where id = auth.uid()
  )
);
