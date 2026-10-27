-- Security hardening follow-up for production deployment.
-- Apply this after validating that application server routes handle payment writes.

alter table if exists public.rent_payments enable row level security;

drop policy if exists "Anyone can insert rent payments" on public.rent_payments;
drop policy if exists "Authenticated users can insert rent payments" on public.rent_payments;
drop policy if exists "Users can insert rent payments" on public.rent_payments;

revoke all on function public.confirm_and_pay_maintenance(uuid, uuid) from public;
revoke all on function public.confirm_and_pay_maintenance(uuid, uuid) from anon;
revoke all on function public.confirm_and_pay_maintenance(uuid, uuid) from authenticated;

notify pgrst, 'reload schema';
