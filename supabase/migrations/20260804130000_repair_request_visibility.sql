begin;

alter table public.rentals
  add column if not exists landlord_id uuid references public.profiles(id);

update public.rentals r
set landlord_id = p.landlord_id
from public.properties p
where p.id = r.property_id
  and r.landlord_id is distinct from p.landlord_id;

create index if not exists rentals_landlord_status_idx
  on public.rentals(landlord_id, status, created_at desc);

drop policy if exists "Landlords can view rental applications by property" on public.rentals;
create policy "Landlords can view rental applications by property"
  on public.rentals for select using (
    auth.uid() = landlord_id
    or exists (
      select 1
      from public.properties p
      where p.id = rentals.property_id
        and p.landlord_id = auth.uid()
    )
  );

drop policy if exists "Landlords can update rental applications by property" on public.rentals;
create policy "Landlords can update rental applications by property"
  on public.rentals for update using (
    auth.uid() = landlord_id
    or exists (
      select 1
      from public.properties p
      where p.id = rentals.property_id
        and p.landlord_id = auth.uid()
    )
  ) with check (
    auth.uid() = landlord_id
    or exists (
      select 1
      from public.properties p
      where p.id = rentals.property_id
        and p.landlord_id = auth.uid()
    )
  );

update public.inspection_bookings i
set landlord_id = p.landlord_id
from public.properties p
where p.id = i.property_id
  and i.landlord_id is distinct from p.landlord_id;

create index if not exists inspection_bookings_landlord_status_idx
  on public.inspection_bookings(landlord_id, status, inspection_date, inspection_time);

drop policy if exists "Landlords can view inspections by property" on public.inspection_bookings;
create policy "Landlords can view inspections by property"
  on public.inspection_bookings for select using (
    auth.uid() = landlord_id
    or exists (
      select 1
      from public.properties p
      where p.id = inspection_bookings.property_id
        and p.landlord_id = auth.uid()
    )
  );

drop policy if exists "Landlords can update inspections by property" on public.inspection_bookings;
create policy "Landlords can update inspections by property"
  on public.inspection_bookings for update using (
    auth.uid() = landlord_id
    or exists (
      select 1
      from public.properties p
      where p.id = inspection_bookings.property_id
        and p.landlord_id = auth.uid()
    )
  );

commit;

notify pgrst, 'reload config';
