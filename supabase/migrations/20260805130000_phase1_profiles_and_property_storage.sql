-- Phase 1: keep the auth profile record complete and restrict property uploads
-- to the authenticated landlord's own folder.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists occupation text,
  add column if not exists company text,
  add column if not exists bio text,
  add column if not exists emergency_contact text,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists avatar_url text;

do $$ begin
  alter table public.profiles add constraint profiles_verification_status_check
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));
exception when duplicate_object then null; end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first_name_value text := coalesce(metadata->>'first_name', '');
  last_name_value text := coalesce(metadata->>'last_name', '');
  full_name_value text;
  role_value text;
begin
  full_name_value := coalesce(nullif(trim(metadata->>'full_name'), ''), nullif(trim(first_name_value || ' ' || last_name_value), ''), 'User');
  role_value := case metadata->>'role'
    when 'landlord' then 'landlord'
    when 'tenant' then 'tenant'
    when 'service_provider' then 'service_provider'
    when 'admin' then 'admin'
    else 'tenant'
  end;

  insert into public.profiles (id, email, first_name, last_name, phone, role, name, full_name)
  values (new.id, new.email, first_name_value, last_name_value, nullif(metadata->>'phone', ''), role_value, full_name_value, full_name_value)
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = coalesce(excluded.phone, public.profiles.phone),
    role = excluded.role,
    name = excluded.name,
    full_name = excluded.full_name;
  return new;
end;
$$;

drop policy if exists "property-images landlord insert" on storage.objects;
drop policy if exists "property-images landlord update" on storage.objects;
drop policy if exists "property-images landlord delete" on storage.objects;

create policy "property-images landlord insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'landlord')
  );

create policy "property-images landlord update"
  on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and owner = auth.uid())
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "property-images landlord delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and owner = auth.uid());
