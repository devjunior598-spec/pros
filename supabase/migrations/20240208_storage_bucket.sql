-- Create a new storage bucket for properties (idempotent)
insert into storage.buckets (id, name, public)
values ('properties', 'properties', true)
on conflict (id) do nothing;

-- Policies (Drop first to avoid errors if they already exist)

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'properties' );

drop policy if exists "Authenticated users can upload images" on storage.objects;
create policy "Authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'properties' );

drop policy if exists "Users can update own images" on storage.objects;
create policy "Users can update own images"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'properties' and auth.uid() = owner );

drop policy if exists "Users can delete own images" on storage.objects;
create policy "Users can delete own images"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'properties' and auth.uid() = owner );
