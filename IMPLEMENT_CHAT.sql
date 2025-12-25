-- Create messages table for Chat feature
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  family_id text not null, -- Scoped to family, references families(id) conceptually
  user_id uuid not null references auth.users(id),
  user_name text, -- De-normalized for easier display
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Create Policy for SELECT (View messages in own family)
create policy "Users can view messages in their family"
  on public.messages for select
  using (
    family_id in (
      select family_id from public.profiles where id = auth.uid()
    )
  );

-- Create Policy for INSERT (Send messages to own family)
create policy "Users can insert messages to their family"
  on public.messages for insert
  with check (
    family_id in (
      select family_id from public.profiles where id = auth.uid()
    )
  );

-- Enable Realtime for messages
alter publication supabase_realtime add table public.messages;
