create table if not exists public.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_alerts boolean not null default true,
  maintenance_updates boolean not null default true,
  payment_reminders boolean not null default true,
  marketing_emails boolean not null default false,
  sms_alerts boolean not null default false,
  push_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_notification_preferences enable row level security;

drop policy if exists "Users can read their notification preferences" on public.user_notification_preferences;
create policy "Users can read their notification preferences"
on public.user_notification_preferences for select using (auth.uid() = user_id);

drop policy if exists "Users can create their notification preferences" on public.user_notification_preferences;
create policy "Users can create their notification preferences"
on public.user_notification_preferences for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their notification preferences" on public.user_notification_preferences;
create policy "Users can update their notification preferences"
on public.user_notification_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
