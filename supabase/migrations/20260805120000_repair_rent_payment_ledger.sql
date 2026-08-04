alter table public.bills
  add column if not exists amount_paid numeric not null default 0;

alter table public.bills drop constraint if exists bills_amount_paid_check;
alter table public.bills add constraint bills_amount_paid_check check (amount_paid >= 0);

create table if not exists public.rent_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.profiles(id) on delete set null,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  bill_id uuid references public.bills(id) on delete set null,
  amount numeric not null check (amount > 0),
  payment_method text not null,
  transaction_reference text unique not null,
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid', 'Failed', 'Overdue', 'Refunded')),
  due_date date,
  payment_date timestamptz,
  receipt_number text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rent_payments_landlord_created_idx on public.rent_payments(landlord_id, created_at desc);
create index if not exists rent_payments_tenant_created_idx on public.rent_payments(tenant_id, created_at desc);
create index if not exists rent_payments_bill_idx on public.rent_payments(bill_id);

alter table public.rent_payments enable row level security;
drop policy if exists "Tenants can view own rent payments" on public.rent_payments;
create policy "Tenants can view own rent payments" on public.rent_payments for select using (auth.uid() = tenant_id);
drop policy if exists "Landlords can view own rent payments" on public.rent_payments;
create policy "Landlords can view own rent payments" on public.rent_payments for select using (auth.uid() = landlord_id);
drop policy if exists "Admins can view all rent payments" on public.rent_payments;
create policy "Admins can view all rent payments" on public.rent_payments for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Users can create own rent payments" on public.rent_payments;
create policy "Users can create own rent payments" on public.rent_payments for insert with check (auth.uid() = tenant_id);
drop policy if exists "Counterparts can update rent payments" on public.rent_payments;
create policy "Counterparts can update rent payments" on public.rent_payments for update using (auth.uid() in (tenant_id, landlord_id));

insert into public.rent_payments (
  id, tenant_id, landlord_id, property_id, bill_id, amount, payment_method,
  transaction_reference, payment_status, due_date, payment_date, receipt_number, created_at, updated_at
)
select
  p.id, r.tenant_id, r.landlord_id, r.property_id, p.bill_id, p.amount,
  case when lower(coalesce(p.payment_method, p.channel, '')) = 'wallet' then 'Wallet' else 'Paystack' end,
  coalesce(nullif(p.reference, ''), 'PAY-' || p.id::text),
  case lower(coalesce(p.status, 'pending')) when 'success' then 'Paid' when 'paid' then 'Paid' when 'failed' then 'Failed' when 'refunded' then 'Refunded' else 'Pending' end,
  b.due_date,
  case when lower(coalesce(p.status, '')) in ('success', 'paid') then p.created_at else null end,
  case when lower(coalesce(p.status, '')) in ('success', 'paid') then 'RCP-' || upper(substr(replace(p.id::text, '-', ''), 1, 12)) else null end,
  p.created_at, p.created_at
from public.payments p
left join public.bills b on b.id = p.bill_id
join public.rentals r on r.id = coalesce(p.rental_id, b.rental_id)
on conflict (transaction_reference) do nothing;

update public.bills b
set amount_paid = totals.paid,
    status = case when totals.paid >= b.amount then 'paid' else b.status end,
    paid_at = case when totals.paid >= b.amount then coalesce(b.paid_at, now()) else b.paid_at end
from (
  select bill_id, sum(amount) as paid from public.rent_payments where payment_status = 'Paid' and bill_id is not null group by bill_id
) totals
where b.id = totals.bill_id;

create or replace function public.prms_sync_legacy_payment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_rental public.rentals%rowtype;
  target_bill public.bills%rowtype;
begin
  if new.bill_id is not null then select * into target_bill from public.bills where id = new.bill_id; end if;
  select * into target_rental from public.rentals where id = coalesce(new.rental_id, target_bill.rental_id);
  if target_rental.id is null then return new; end if;

  insert into public.rent_payments (id, tenant_id, landlord_id, property_id, bill_id, amount, payment_method, transaction_reference, payment_status, due_date, payment_date, receipt_number, created_at, updated_at)
  values (
    new.id, target_rental.tenant_id, target_rental.landlord_id, target_rental.property_id, new.bill_id, new.amount,
    case when lower(coalesce(new.payment_method, new.channel, '')) = 'wallet' then 'Wallet' else 'Paystack' end,
    coalesce(nullif(new.reference, ''), 'PAY-' || new.id::text),
    case lower(coalesce(new.status, 'pending')) when 'success' then 'Paid' when 'paid' then 'Paid' when 'failed' then 'Failed' when 'refunded' then 'Refunded' else 'Pending' end,
    target_bill.due_date,
    case when lower(coalesce(new.status, '')) in ('success', 'paid') then new.created_at else null end,
    case when lower(coalesce(new.status, '')) in ('success', 'paid') then 'RCP-' || upper(substr(replace(new.id::text, '-', ''), 1, 12)) else null end,
    new.created_at, now()
  )
  on conflict (id) do update set amount = excluded.amount, payment_status = excluded.payment_status, payment_date = excluded.payment_date, updated_at = now();
  return new;
end;
$$;

drop trigger if exists prms_sync_legacy_payment_trigger on public.payments;
create trigger prms_sync_legacy_payment_trigger after insert or update on public.payments
for each row execute function public.prms_sync_legacy_payment();

notify pgrst, 'reload schema';
