begin;

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
  full_name_value := coalesce(nullif(trim(metadata->>'full_name'), ''), nullif(trim(first_name_value || ' ' || last_name_value), ''), nullif(trim(metadata->>'name'), ''), 'User');
  role_value := case metadata->>'role'
    when 'landlord' then 'landlord'
    when 'service_provider' then 'service_provider'
    else 'tenant'
  end;
  insert into public.profiles (id, email, first_name, last_name, phone, role, name, full_name)
  values (new.id, new.email, first_name_value, last_name_value, nullif(metadata->>'phone', ''), role_value, full_name_value, full_name_value)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, first_name, last_name, phone, role, name, full_name)
select account.id, account.email,
  coalesce(account.raw_user_meta_data->>'first_name', ''),
  coalesce(account.raw_user_meta_data->>'last_name', ''),
  nullif(account.raw_user_meta_data->>'phone', ''),
  case account.raw_user_meta_data->>'role' when 'landlord' then 'landlord' when 'service_provider' then 'service_provider' else 'tenant' end,
  coalesce(nullif(trim(account.raw_user_meta_data->>'full_name'), ''), nullif(trim(concat_ws(' ', account.raw_user_meta_data->>'first_name', account.raw_user_meta_data->>'last_name')), ''), 'User'),
  coalesce(nullif(trim(account.raw_user_meta_data->>'full_name'), ''), nullif(trim(concat_ws(' ', account.raw_user_meta_data->>'first_name', account.raw_user_meta_data->>'last_name')), ''), 'User')
from auth.users account
where account.email is not null
  and coalesce(account.raw_user_meta_data->>'role', 'tenant') in ('tenant', 'landlord', 'service_provider')
  and not exists (select 1 from public.profiles profile where profile.id = account.id)
on conflict (id) do nothing;

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'DELETE' then
      raise exception 'Account deletion requires the secured account-management service' using errcode = '42501';
    end if;
    if new.id is distinct from auth.uid() then
      raise exception 'Profile ownership required' using errcode = '42501';
    end if;
    if tg_op = 'INSERT' then
      raise exception 'Profiles are created by the signup service' using errcode = '42501';
    end if;
    if new.id is distinct from old.id or new.role is distinct from old.role
      or new.is_verified is distinct from old.is_verified
      or new.verification_status is distinct from old.verification_status
      or new.balance is distinct from old.balance or new.status is distinct from old.status then
      raise exception 'Protected account fields require the secured account-management service' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges before insert or update or delete on public.profiles
for each row execute function public.guard_profile_privileges();

create or replace function public.guard_provider_privileges()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op <> 'UPDATE' then
      raise exception 'Provider registration and deletion require the secured provider service' using errcode = '42501';
    end if;
    if new.user_id is distinct from auth.uid()
      or not exists (select 1 from public.profiles where id = auth.uid() and role = 'service_provider') then
      raise exception 'Provider ownership required' using errcode = '42501';
    end if;
    if new.id is distinct from old.id or new.user_id is distinct from old.user_id
      or new.verified is distinct from old.verified
      or new.approval_status is distinct from old.approval_status
      or new.verification_status is distinct from old.verification_status
      or new.verified_at is distinct from old.verified_at then
      raise exception 'Provider approval requires administrator review' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists guard_provider_privileges on public.service_providers;
create trigger guard_provider_privileges before insert or update or delete on public.service_providers
for each row execute function public.guard_provider_privileges();

notify pgrst, 'reload schema';
commit;
