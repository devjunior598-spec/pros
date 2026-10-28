-- Rental records remain rentals. Sales have their own purpose, price, and inquiry flow.
alter table public.properties
  add column if not exists listing_purpose text not null default 'rent',
  add column if not exists sale_price numeric,
  add column if not exists lot_size_sqft numeric,
  add column if not exists is_approved boolean not null default false;

alter table public.properties alter column country set default 'United States';

do $$ begin
  alter table public.properties add constraint properties_listing_purpose_check
    check (listing_purpose in ('rent', 'sale', 'both'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.properties add constraint properties_sale_price_check
    check ((listing_purpose = 'rent' and sale_price is null) or
           (listing_purpose in ('sale', 'both') and sale_price > 0));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.properties add constraint properties_lot_size_check
    check (lot_size_sqft is null or lot_size_sqft > 0);
exception when duplicate_object then null; end $$;

create index if not exists properties_listing_purpose_idx
  on public.properties(listing_purpose, publication_status, status);

create table if not exists public.sale_inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
  contact_email text not null check (char_length(trim(contact_email)) between 5 and 254),
  contact_phone text,
  message text not null check (char_length(trim(message)) between 10 and 2000),
  preferred_viewing_date date,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  constraint sale_inquiries_not_self check (buyer_id <> seller_id)
);

create index if not exists sale_inquiries_buyer_idx on public.sale_inquiries(buyer_id, created_at desc);
create index if not exists sale_inquiries_seller_idx on public.sale_inquiries(seller_id, created_at desc);

alter table public.sale_inquiries enable row level security;

create policy sale_inquiries_read on public.sale_inquiries for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy sale_inquiries_insert on public.sale_inquiries for insert to authenticated
  with check (
    buyer_id = auth.uid() and status = 'new' and
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.landlord_id = seller_id
        and p.country = 'United States' and p.status = 'available'
        and p.verification_status = 'approved'
        and p.publication_status = 'published'
        and p.listing_purpose in ('sale', 'both')
    )
  );

create policy sale_inquiries_seller_update on public.sale_inquiries for update to authenticated
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());

revoke all on public.sale_inquiries from anon, authenticated;
grant select, insert on public.sale_inquiries to authenticated;
grant update (status) on public.sale_inquiries to authenticated;
