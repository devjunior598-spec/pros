-- Ensure profiles table exists
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  role text, -- 'tenant' or 'landlord'
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add columns if they are missing (idempotent)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'role') then
    alter table public.profiles add column role text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'phone') then
    alter table public.profiles add column phone text;
  end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'name') then
    alter table public.profiles add column name text;
  end if;
end $$;

-- Enable RLS
alter table public.profiles enable row level security;

-- Re-create policies to be safe (drop first to avoid errors)
drop policy if exists "Enable read access for users based on user_id" on public.profiles;
drop policy if exists "Enable insert for users based on user_id" on public.profiles;
drop policy if exists "Enable update for users based on user_id" on public.profiles;

create policy "Enable read access for users based on user_id"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Enable insert for users based on user_id"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Enable update for users based on user_id"
  on public.profiles for update
  using ( auth.uid() = id );

-- Re-create the trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    new.raw_user_meta_data->>'role'
  )
  on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email,
    role = excluded.role;
  return new;
end;
$$ language plpgsql security definer;

-- Re-create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
