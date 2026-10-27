-- PRMS utility billing, property payment preferences, and admin-controlled settlements.
alter table public.properties
  add column if not exists electricity_meter_number text,
  add column if not exists electricity_payment_method text not null default 'landlord_bill',
  add column if not exists water_payment_method text not null default 'landlord_bill',
  add column if not exists waste_payment_method text not null default 'landlord_bill',
  add column if not exists utility_notes text;

alter table public.bills
  add column if not exists description text,
  add column if not exists billing_period text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;
create index if not exists bills_rental_due_idx on public.bills(rental_id, due_date);

drop policy if exists "Landlords can view rental bills" on public.bills;
create policy "Landlords can view rental bills" on public.bills for select using (
  exists (select 1 from public.rentals r where r.id = rental_id and r.landlord_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
drop policy if exists "Landlords can create rental bills" on public.bills;
create policy "Landlords can create rental bills" on public.bills for insert with check (
  created_by = auth.uid() and exists (select 1 from public.rentals r where r.id = rental_id and r.landlord_id = auth.uid())
);
drop policy if exists "Landlords can update rental bills" on public.bills;
create policy "Landlords can update rental bills" on public.bills for update using (
  exists (select 1 from public.rentals r where r.id = rental_id and r.landlord_id = auth.uid())
);

create table if not exists public.system_settings (
  id integer primary key default 1 check (id = 1),
  site_name text not null default 'House Do PRMS',
  support_email text not null default 'support@housedo.com',
  maintenance_mode boolean not null default false,
  commission_rate numeric not null default 5 check (commission_rate between 0 and 100),
  min_withdrawal numeric not null default 5000 check (min_withdrawal >= 0),
  two_factor_required boolean not null default true,
  auto_payouts_enabled boolean not null default false,
  require_admin_payment_approval boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.system_settings(id) values (1) on conflict (id) do nothing;
alter table public.system_settings enable row level security;
drop policy if exists "Admins manage system settings" on public.system_settings;
create policy "Admins manage system settings" on public.system_settings for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

alter table public.landlord_settlements
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejection_reason text;
create unique index if not exists landlord_settlements_payment_unique
  on public.landlord_settlements(payment_id) where payment_id is not null;

-- Normalize legacy withdrawal shapes used by landlord and admin payout screens.
alter table public.withdrawals
  add column if not exists bank_account_id uuid references public.bank_accounts(id) on delete set null,
  add column if not exists bank_name text,
  add column if not exists account_number text,
  add column if not exists account_name text,
  add column if not exists bank_details jsonb,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();
alter table public.withdrawals drop constraint if exists withdrawals_status_check;
alter table public.withdrawals add constraint withdrawals_status_check
  check (status in ('pending', 'processing', 'approved', 'rejected', 'completed', 'success', 'failed', 'cancelled'));

-- Paying clears the tenant's bill; approval releases the landlord's settlement.
drop trigger if exists on_bill_paid on public.bills;

create or replace function public.approve_landlord_settlement(p_settlement_id uuid, p_action text, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare settlement_row public.landlord_settlements%rowtype;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  if p_action not in ('approve', 'reject') then raise exception 'Invalid settlement action'; end if;
  select * into settlement_row from public.landlord_settlements where id = p_settlement_id for update;
  if settlement_row.id is null then raise exception 'Settlement not found'; end if;
  if settlement_row.status <> 'Pending' then raise exception 'Settlement has already been processed'; end if;
  if p_action = 'reject' then
    update public.landlord_settlements set status = 'Held', approved_by = auth.uid(), approved_at = now(),
      rejection_reason = nullif(trim(p_reason), '') where id = settlement_row.id;
    return jsonb_build_object('success', true, 'status', 'Held');
  end if;
  insert into public.landlord_wallets(landlord_id, balance, total_earnings)
  values (settlement_row.landlord_id, settlement_row.net_amount, settlement_row.net_amount)
  on conflict (landlord_id) do update set
    balance = public.landlord_wallets.balance + excluded.balance,
    total_earnings = public.landlord_wallets.total_earnings + excluded.total_earnings;
  insert into public.landlord_transactions(landlord_id, type, amount, description, reference)
  values (settlement_row.landlord_id, 'credit', settlement_row.net_amount,
    'Admin-approved tenant payment settlement', 'settlement-' || settlement_row.id::text);
  update public.landlord_settlements set status = 'Settled', settled_at = now(), approved_by = auth.uid(),
    approved_at = now(), rejection_reason = null where id = settlement_row.id;
  return jsonb_build_object('success', true, 'status', 'Settled', 'amount', settlement_row.net_amount);
end;
$$;
revoke all on function public.approve_landlord_settlement(uuid, text, text) from public;
grant execute on function public.approve_landlord_settlement(uuid, text, text) to authenticated;
notify pgrst, 'reload schema';


create or replace function public.process_wallet_payment(
  p_bill_id uuid, p_amount numeric, p_tenant_id uuid, p_reference text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  wallet_balance numeric;
  bill_row record;
  payment_id uuid;
  commission numeric;
  platform_fee numeric;
  net_amount numeric;
  total_paid numeric;
begin
  if auth.uid() is null or auth.uid() <> p_tenant_id then raise exception 'Unauthorized wallet payment'; end if;
  if p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;

  select b.id, b.amount, b.amount_paid, b.due_date, b.type, b.status,
         r.id rental_id, r.tenant_id, r.landlord_id, r.property_id
    into bill_row
    from public.bills b join public.rentals r on r.id = b.rental_id
    where b.id = p_bill_id for update;
  if bill_row.id is null or bill_row.tenant_id <> p_tenant_id then raise exception 'Bill does not belong to this tenant'; end if;
  if bill_row.status = 'paid' or p_amount > (bill_row.amount - coalesce(bill_row.amount_paid, 0)) then
    raise exception 'Payment exceeds outstanding bill balance';
  end if;

  select balance into wallet_balance from public.wallets where tenant_id = p_tenant_id for update;
  if wallet_balance is null then raise exception 'Wallet not found'; end if;
  if wallet_balance < p_amount then raise exception 'Insufficient wallet balance'; end if;

  update public.wallets set balance = balance - p_amount where tenant_id = p_tenant_id;
  insert into public.transactions(tenant_id, type, amount, reference, status, description)
    values (p_tenant_id, 'debit', p_amount, p_reference, 'success', 'Bill payment: ' || p_bill_id::text);

  insert into public.payments(
    bill_id, landlord_id, tenant_id, property_id, amount, currency, payment_type,
    payment_method, provider, reference, transaction_reference, status, payment_status,
    payment_date, verified_at, metadata
  ) values (
    p_bill_id, bill_row.landlord_id, p_tenant_id, bill_row.property_id, p_amount, 'NGN',
    coalesce(bill_row.type, 'custom'), 'Wallet', 'Wallet', p_reference, p_reference,
    'success', 'Successful', now(), now(), jsonb_build_object('bill_id', p_bill_id, 'rental_id', bill_row.rental_id)
  ) returning id into payment_id;

  total_paid := coalesce(bill_row.amount_paid, 0) + p_amount;
  update public.bills set amount_paid = total_paid,
    status = case when total_paid >= bill_row.amount then 'paid' else 'partially_paid' end,
    paid_at = case when total_paid >= bill_row.amount then now() else null end
    where id = p_bill_id;

  insert into public.rent_payments(
    id, tenant_id, landlord_id, property_id, bill_id, amount, payment_method,
    transaction_reference, payment_status, due_date, payment_date, receipt_number, updated_at
  ) values (
    payment_id, p_tenant_id, bill_row.landlord_id, bill_row.property_id, p_bill_id, p_amount,
    'Wallet', p_reference, 'Paid', bill_row.due_date, now(),
    'RCP-' || upper(substr(replace(payment_id::text, '-', ''), 1, 12)), now()
  ) on conflict (transaction_reference) do nothing;

  select commission_rate into commission from public.system_settings where id = 1;
  platform_fee := round(p_amount * coalesce(commission, 1.5) / 100, 2);
  net_amount := greatest(0, p_amount - platform_fee);
  insert into public.platform_fees(payment_id, fee_type, fee_amount, percentage, recipient)
    values (payment_id, 'transaction_fee', platform_fee, coalesce(commission, 1.5), 'PRMS Platform');
  insert into public.landlord_settlements(
    landlord_id, payment_id, gross_amount, processor_fee, prms_fee, net_amount, status
  ) values (
    bill_row.landlord_id, payment_id, p_amount, 0, platform_fee, net_amount, 'Pending'
  ) on conflict (payment_id) do nothing;

  return jsonb_build_object('success', true, 'message', 'Payment successful and awaiting settlement approval');
exception when others then
  return jsonb_build_object('success', false, 'message', sqlerrm);
end;
$$;
revoke all on function public.process_wallet_payment(uuid, numeric, uuid, text) from public;
grant execute on function public.process_wallet_payment(uuid, numeric, uuid, text) to authenticated;
