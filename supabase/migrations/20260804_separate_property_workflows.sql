alter table public.properties
  add column if not exists country text not null default 'Nigeria',
  add column if not exists building_rules text[] not null default '{}',
  add column if not exists parking_details text,
  add column if not exists security_details text,
  add column if not exists manager_name text,
  add column if not exists manager_phone text,
  add column if not exists publication_status text not null default 'published';

do $$ begin
  alter table public.properties add constraint properties_publication_status_check
    check (publication_status in ('draft', 'published', 'archived'));
exception when duplicate_object then null; end $$;

alter table public.property_units
  add column if not exists deposit numeric not null default 0,
  add column if not exists meter_number text,
  add column if not exists parking_slot text,
  add column if not exists balcony boolean not null default false,
  add column if not exists published boolean not null default true;

do $$ begin
  alter table public.property_units add constraint property_units_deposit_check check (deposit >= 0);
exception when duplicate_object then null; end $$;

create index if not exists properties_publication_idx on public.properties(publication_status, status);
create index if not exists property_units_listing_idx on public.property_units(property_id, published, availability);
