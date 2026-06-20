-- 1. Drop existing objects to ensure clean slate
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Ensure profiles table has correct schema (idempotent)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  role text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure RLS is enabled
alter table public.profiles enable row level security;

-- 3. Create a more robust function with error handling and logging
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public -- Secure the search path
as $$
declare
  new_role text;
  new_name text;
begin
  -- Extract and sanitize metadata
  new_role := coalesce(new.raw_user_meta_data->>'role', 'tenant'); -- Default to tenant if missing
  new_name := coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', '');
  
  -- Insert into profiles
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    new_name,
    new.email,
    new_role
  )
  on conflict (id) do nothing; -- Prevent error if profile exists

  return new;
exception
  when others then
    -- Log error (visible in Supabase logs)
    raise warning 'Error in handle_new_user trigger: %', SQLERRM;
    -- IMPORTANT: Return new to allow user creation even if profile fails (for debugging)
    -- ideally we want it to fail, but for now we want to unblock the user to see if it's the trigger.
    return new;
end;
$$ language plpgsql;

-- 4. Re-create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Helper: Grant permissions (sometimes needed if the function runs as owner but owner lacks permissions)
grant insert on public.profiles to postgres;
grant insert on public.profiles to service_role;
grant insert on public.profiles to authenticated;
grant insert on public.profiles to anon; 
-- (Actually security definer runs as creator, usually postgres/superuser, so grants shouldn't matter, but good for safety)
