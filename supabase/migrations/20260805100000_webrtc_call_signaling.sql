create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  caller_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'initiated',
  type text not null default 'audio',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.calls
  add column if not exists offer jsonb,
  add column if not exists answer jsonb;

alter table public.calls enable row level security;
drop policy if exists "Users can view their own calls" on public.calls;
create policy "Users can view their own calls" on public.calls for select using (auth.uid() = caller_id or auth.uid() = receiver_id);
drop policy if exists "Users can insert calls" on public.calls;
create policy "Users can insert calls" on public.calls for insert with check (
  auth.uid() = caller_id and exists (
    select 1 from public.conversations c where c.id = conversation_id and (c.landlord_id = auth.uid() or c.tenant_id = auth.uid())
  )
);
drop policy if exists "Users can update their own calls" on public.calls;
create policy "Users can update their own calls" on public.calls for update using (auth.uid() = caller_id or auth.uid() = receiver_id) with check (auth.uid() = caller_id or auth.uid() = receiver_id);

create index if not exists idx_calls_caller_id on public.calls(caller_id);
create index if not exists idx_calls_receiver_id on public.calls(receiver_id);
create index if not exists idx_calls_conversation_id on public.calls(conversation_id);

do $$ begin
  alter publication supabase_realtime add table public.calls;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
