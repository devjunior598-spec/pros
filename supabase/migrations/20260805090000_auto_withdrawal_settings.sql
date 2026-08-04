alter table public.profiles
  add column if not exists auto_withdrawal_enabled boolean not null default false,
  add column if not exists auto_withdrawal_threshold numeric not null default 100000,
  add column if not exists auto_withdrawal_bank_account_id uuid references public.bank_accounts(id) on delete set null;

alter table public.profiles drop constraint if exists profiles_auto_withdrawal_threshold_check;
alter table public.profiles add constraint profiles_auto_withdrawal_threshold_check
  check (auto_withdrawal_threshold >= 5000);

create or replace function public.prms_create_auto_withdrawal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings record;
begin
  select auto_withdrawal_enabled, auto_withdrawal_threshold, auto_withdrawal_bank_account_id
    into settings
  from public.profiles
  where id = new.tenant_id;

  if coalesce(settings.auto_withdrawal_enabled, false)
     and settings.auto_withdrawal_bank_account_id is not null
     and new.balance >= coalesce(settings.auto_withdrawal_threshold, 100000)
     and not exists (
       select 1 from public.withdrawals
       where landlord_id = new.tenant_id and status in ('pending', 'processing')
     ) then
    insert into public.withdrawals (landlord_id, amount, status, bank_name, account_number, account_name)
    select new.tenant_id, new.balance, 'pending', bank_name, account_number, account_name
    from public.bank_accounts
    where id = settings.auto_withdrawal_bank_account_id and landlord_id = new.tenant_id;
  end if;

  return new;
end;
$$;

drop trigger if exists prms_auto_withdrawal_on_wallet_change on public.wallets;
create trigger prms_auto_withdrawal_on_wallet_change
after insert or update of balance on public.wallets
for each row execute function public.prms_create_auto_withdrawal();

notify pgrst, 'reload schema';
