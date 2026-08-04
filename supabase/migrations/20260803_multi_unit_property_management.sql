-- Multi-unit property management for PRMS.
-- This migration is additive: existing single-unit listings continue to work.

alter table public.properties
  add column if not exists is_multi_unit boolean not null default false,
  add column if not exists shared_amenities text[] not null default '{}',
  add column if not exists shared_images text[] not null default '{}',
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists property_manager_id uuid references public.profiles(id) on delete set null;

create table if not exists public.property_units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  toilets integer not null default 0 check (toilets >= 0),
  floor text,
  size numeric check (size is null or size >= 0),
  rent numeric not null default 0 check (rent >= 0),
  payment_frequency text not null default 'yearly' check (payment_frequency in ('daily','weekly','monthly','quarterly','biannually','yearly')),
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  availability text not null default 'available' check (availability in ('available','occupied','reserved','maintenance','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, name)
);

create index if not exists property_units_property_idx on public.property_units(property_id);
create index if not exists property_units_landlord_idx on public.property_units(landlord_id);
create index if not exists property_units_search_idx on public.property_units(availability, bedrooms, bathrooms, rent);

create table if not exists public.unit_tenants (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.property_units(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  occupation text,
  move_in_date date not null,
  move_out_date date,
  rent_due_date date,
  status text not null default 'active' check (status in ('pending','active','notice','moved_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists one_active_tenant_per_unit on public.unit_tenants(unit_id) where status = 'active';

create table if not exists public.leases (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.property_units(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null check (end_date > start_date),
  rent_amount numeric not null check (rent_amount >= 0),
  payment_frequency text not null default 'yearly',
  terms text,
  document_url text,
  landlord_signature text,
  tenant_signature text,
  landlord_signed_at timestamptz,
  tenant_signed_at timestamptz,
  sent_at timestamptz,
  status text not null default 'draft' check (status in ('draft','sent','active','expired','terminated','renewed')),
  renewed_from uuid references public.leases(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leases_unit_idx on public.leases(unit_id);

create table if not exists public.unit_payments (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.property_units(id) on delete cascade,
  lease_id uuid references public.leases(id) on delete set null,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid references public.profiles(id) on delete set null,
  amount numeric not null check (amount > 0),
  due_date date not null,
  paid_at timestamptz,
  reference text unique,
  payment_method text,
  period_start date,
  period_end date,
  status text not null default 'pending' check (status in ('pending','processing','paid','overdue','failed','refunded')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists unit_payments_unit_idx on public.unit_payments(unit_id, due_date desc);

create table if not exists public.unit_maintenance (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.property_units(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'pending' check (status in ('pending','assigned','in_progress','completed','cancelled')),
  cost numeric check (cost is null or cost >= 0),
  images text[] not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists unit_maintenance_unit_idx on public.unit_maintenance(unit_id, created_at desc);

-- Existing installations may already have inspection_bookings; extend it when present,
-- otherwise create the canonical table.
create table if not exists public.inspection_bookings (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.property_units(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  landlord_id uuid references public.profiles(id) on delete cascade,
  tenant_id uuid references public.profiles(id) on delete set null,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  scheduled_at timestamptz not null,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.inspection_bookings add column if not exists unit_id uuid references public.property_units(id) on delete cascade;

alter table public.property_units enable row level security;
alter table public.unit_tenants enable row level security;
alter table public.leases enable row level security;
alter table public.unit_payments enable row level security;
alter table public.unit_maintenance enable row level security;
alter table public.inspection_bookings enable row level security;

create or replace function public.prms_is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- Public users can discover available units; owners, assigned tenants and admins get full visibility.
drop policy if exists "units_select" on public.property_units;
create policy "units_select" on public.property_units for select using (
  availability = 'available' or landlord_id = auth.uid() or public.prms_is_admin() or
  exists(select 1 from public.unit_tenants t where t.unit_id = id and t.tenant_id = auth.uid() and t.status = 'active')
);
drop policy if exists "landlords_manage_units" on public.property_units;
create policy "landlords_manage_units" on public.property_units for all using (landlord_id = auth.uid() or public.prms_is_admin())
with check (landlord_id = auth.uid() or public.prms_is_admin());

do $policies$
declare tbl text;
begin
  foreach tbl in array array['unit_tenants','leases','unit_payments','unit_maintenance'] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_access', tbl);
    execute format('create policy %I on public.%I for select using (landlord_id = auth.uid() or tenant_id = auth.uid() or public.prms_is_admin())', tbl || '_access', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_owner_manage', tbl);
    execute format('create policy %I on public.%I for all using (landlord_id = auth.uid() or public.prms_is_admin()) with check (landlord_id = auth.uid() or public.prms_is_admin())', tbl || '_owner_manage', tbl);
  end loop;
end $policies$;

drop policy if exists "inspection_access" on public.inspection_bookings;
create policy "inspection_access" on public.inspection_bookings for select using (
  landlord_id = auth.uid() or tenant_id = auth.uid() or public.prms_is_admin()
);
drop policy if exists "inspection_create" on public.inspection_bookings;
create policy "inspection_create" on public.inspection_bookings for insert with check (
  tenant_id = auth.uid() or auth.uid() is null or landlord_id = auth.uid() or public.prms_is_admin()
);
drop policy if exists "inspection_owner_update" on public.inspection_bookings;
create policy "inspection_owner_update" on public.inspection_bookings for update using (landlord_id = auth.uid() or public.prms_is_admin());

create or replace function public.sync_unit_availability()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    update public.property_units set availability = case when new.status = 'active' then 'occupied' else availability end, updated_at = now() where id = new.unit_id;
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.status = 'active' and new.status <> 'active') then
    if not exists(select 1 from public.unit_tenants where unit_id = old.unit_id and status = 'active' and id <> old.id) then
      update public.property_units set availability = 'available', updated_at = now() where id = old.unit_id;
    end if;
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists unit_tenant_availability on public.unit_tenants;
create trigger unit_tenant_availability after insert or update or delete on public.unit_tenants for each row execute function public.sync_unit_availability();

create or replace view public.property_portfolio_summary with (security_invoker = true) as
select p.id as property_id, p.landlord_id, p.title, p.address, p.city, p.state, p.type, p.images,
       count(u.id)::integer as unit_count,
       count(u.id) filter (where u.availability = 'occupied')::integer as occupied_units,
       count(u.id) filter (where u.availability = 'available')::integer as vacant_units,
       coalesce(sum(case when u.payment_frequency = 'monthly' then u.rent when u.payment_frequency = 'yearly' then u.rent / 12 else 0 end), 0) as monthly_revenue
from public.properties p left join public.property_units u on u.property_id = p.id
group by p.id;
