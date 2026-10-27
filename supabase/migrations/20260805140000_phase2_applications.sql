-- Phase 2: private, reviewable rental applications.
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.property_units(id) on delete set null,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  application_letter text,
  occupation text,
  employer text,
  employment_status text,
  monthly_income numeric,
  preferred_move_in_date date,
  number_of_occupants integer,
  reason_for_moving text,
  guarantor_name text,
  guarantor_phone text,
  guarantor_address text,
  "references" text,
  status text not null default 'draft' check (status in ('draft','submitted','under_review','more_information_required','inspection_requested','approved','rejected','withdrawn','lease_sent')),
  landlord_notes text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('government_id','proof_of_income','employment_letter','supporting_document')),
  file_name text not null,
  file_path text not null unique,
  created_at timestamptz not null default now()
);

create unique index if not exists applications_one_active_per_listing
  on public.applications(tenant_id, property_id, coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('submitted','under_review','more_information_required','inspection_requested','approved','lease_sent');
create index if not exists applications_landlord_created_idx on public.applications(landlord_id, created_at desc);
create index if not exists application_documents_application_idx on public.application_documents(application_id);

alter table public.applications enable row level security;
alter table public.application_documents enable row level security;

drop policy if exists "applications tenant select own" on public.applications;
drop policy if exists "applications landlord select own" on public.applications;
drop policy if exists "applications admin select" on public.applications;
drop policy if exists "applications tenant insert own" on public.applications;
drop policy if exists "applications tenant update draft" on public.applications;
drop policy if exists "applications landlord update own" on public.applications;
create policy "applications tenant select own" on public.applications for select using (tenant_id = auth.uid());
create policy "applications landlord select own" on public.applications for select using (landlord_id = auth.uid());
create policy "applications admin select" on public.applications for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "applications tenant insert own" on public.applications for insert with check (tenant_id = auth.uid());
create policy "applications tenant update draft" on public.applications for update using (tenant_id = auth.uid() and status in ('draft','more_information_required')) with check (tenant_id = auth.uid());
create policy "applications landlord update own" on public.applications for update using (landlord_id = auth.uid()) with check (landlord_id = auth.uid());

drop policy if exists "application documents tenant select own" on public.application_documents;
drop policy if exists "application documents landlord select own" on public.application_documents;
drop policy if exists "application documents admin select" on public.application_documents;
drop policy if exists "application documents tenant insert own" on public.application_documents;
create policy "application documents tenant select own" on public.application_documents for select using (tenant_id = auth.uid());
create policy "application documents landlord select own" on public.application_documents for select using (exists (select 1 from public.applications a where a.id = application_id and a.landlord_id = auth.uid()));
create policy "application documents admin select" on public.application_documents for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "application documents tenant insert own" on public.application_documents for insert with check (tenant_id = auth.uid());

insert into storage.buckets (id, name, public) values ('application-documents', 'application-documents', false) on conflict (id) do update set public = false;
drop policy if exists "application documents storage tenant read" on storage.objects;
drop policy if exists "application documents storage tenant upload" on storage.objects;
drop policy if exists "application documents storage landlord read" on storage.objects;
create policy "application documents storage tenant read" on storage.objects for select to authenticated using (bucket_id = 'application-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "application documents storage tenant upload" on storage.objects for insert to authenticated with check (bucket_id = 'application-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "application documents storage landlord read" on storage.objects for select to authenticated using (
  bucket_id = 'application-documents' and exists (
    select 1 from public.application_documents d join public.applications a on a.id = d.application_id
    where d.file_path = name and a.landlord_id = auth.uid()
  )
);

create or replace function public.phase2_touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists applications_touch_updated_at on public.applications;
create trigger applications_touch_updated_at before update on public.applications for each row execute function public.phase2_touch_updated_at();

alter publication supabase_realtime add table public.applications;
notify pgrst, 'reload schema';
