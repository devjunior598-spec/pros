-- Enable UUID extension (Required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- 1. Profiles Table
-- =====================================
create table profiles (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    email text unique not null,
    phone text,
    role text check (role in ('tenant','landlord')) not null,
    dashboard_unlocked boolean default false,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
    meta_data jsonb;
begin
    meta_data := new.raw_user_meta_data::jsonb;
    insert into public.profiles (id, name, email, role)
    values (
        new.id, 
        coalesce(
            meta_data->>'full_name', 
            (meta_data->>'first_name' || ' ' || meta_data->>'last_name'),
            meta_data->>'name', 
            'User'
        ), 
        new.email, 
        coalesce(meta_data->>'role', 'tenant')
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Enable RLS
alter table profiles enable row level security;
create policy "users can view own profile" on profiles for select using (auth.uid() = id);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

-- =====================================
-- 2. Properties Table
-- =====================================
create table properties (
    id uuid primary key default uuid_generate_v4(),
    landlord_id uuid references profiles(id),
    title text not null,
    price numeric not null,
    address text,
    city text,
    state text,
    area text,
    type text,
    description text,
    images text[],
    status text check (status in ('available','pending','rented')) default 'available',
    current_tenant_id uuid references profiles(id),
    created_at timestamp default now()
);

-- =====================================
-- 3. Rentals Table
-- =====================================
create table rentals (
    id uuid primary key default uuid_generate_v4(),
    property_id uuid references properties(id),
    tenant_id uuid references profiles(id),
    landlord_id uuid references profiles(id),
    rent_start_date date,
    rent_amount numeric,
    employment text,
    income text,
    notes text,
    status text check (status in ('pending','approved','rejected')) default 'pending',
    created_at timestamp default now()
);

-- =====================================
-- 4. Bills Table
-- =====================================
create table bills (
    id uuid primary key default uuid_generate_v4(),
    rental_id uuid references rentals(id),
    type text check (type in ('rent','electricity','water','service','custom')),
    amount numeric not null,
    due_date date,
    status text check (status in ('unpaid','paid','overdue')) default 'unpaid',
    created_at timestamp default now()
);

-- =====================================
-- 5. Payments Table
-- =====================================
create table payments (
    id uuid primary key default uuid_generate_v4(),
    bill_id uuid references bills(id),
    tenant_id uuid references profiles(id),
    landlord_id uuid references profiles(id),
    amount numeric not null,
    payment_method text,
    reference text,
    status text check (status in ('success','failed','pending')) default 'pending',
    created_at timestamp default now()
);

-- =====================================
-- 6. Conversations Table
-- =====================================
create table conversations (
    id uuid primary key default uuid_generate_v4(),
    rental_id uuid references rentals(id),
    tenant_id uuid references profiles(id),
    landlord_id uuid references profiles(id),
    created_at timestamp default now()
);

-- =====================================
-- 7. Messages Table
-- =====================================
create table messages (
    id uuid primary key default uuid_generate_v4(),
    conversation_id uuid references conversations(id),
    sender_id uuid references profiles(id),
    message text,
    is_read boolean default false,
    created_at timestamp default now()
);

-- =====================================
-- 8. Documents Table
-- =====================================
create table documents (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    url text not null,
    storage_path text,
    type text check (type in ('id_card','lease_agreement','proof_of_payment','other')),
    tenant_id uuid references profiles(id),
    rental_id uuid references rentals(id),
    uploaded_by uuid references profiles(id),
    created_at timestamp default now()
);

-- =====================================
-- 9. Activity Logs Table
-- =====================================
create table activity_logs (
    id uuid primary key default uuid_generate_v4(),
    rental_id uuid references rentals(id),
    actor_id uuid references profiles(id),
    action text,
    created_at timestamp default now()
);

-- =====================================
-- 9. Maintenance Requests Table
-- =====================================
create table maintenance_requests (
    id uuid primary key default uuid_generate_v4(),
    rental_id uuid references rentals(id),
    tenant_id uuid references profiles(id),
    title text,
    description text,
    status text check (status in ('pending','in_progress','resolved')) default 'pending',
    created_at timestamp default now()
);

-- =====================================
-- RLS POLICIES
-- =====================================

-- Enable RLS on each table
alter table properties enable row level security;
alter table rentals enable row level security;
alter table bills enable row level security;
alter table payments enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table documents enable row level security;
alter table activity_logs enable row level security;
alter table maintenance_requests enable row level security;

-- =====================================
-- Properties: Only landlord can insert/update their own properties
-- =====================================
create policy "landlord can manage own properties" on properties
for all using (auth.uid() = landlord_id);

create policy "anyone can view properties" on properties
for select using (true);

-- =====================================
-- Rentals: Tenant can only create rental requests
-- Landlord can read rentals of their properties
-- =====================================
create policy "tenant can create rental" on rentals
for insert with check (auth.uid() = tenant_id);

create policy "tenant can read own rental" on rentals
for select using (auth.uid() = tenant_id);

create policy "landlord can read rentals of own properties" on rentals
for select using (auth.uid() = landlord_id);

create policy "landlord can update rental status" on rentals
for update using (auth.uid() = landlord_id);

-- =====================================
-- Bills: Only tenant for their rental can view/pay
-- Landlord can manage bills for their rental
-- =====================================
create policy "tenant can read bills" on bills
for select using (rental_id in (select id from rentals where tenant_id = auth.uid() and status='approved'));

create policy "landlord can manage bills" on bills
for all using (rental_id in (select id from rentals where landlord_id = auth.uid()));

-- =====================================
-- Payments: Tenant can insert only for their bills
-- Landlord can view payments for their rentals
-- =====================================
create policy "tenant can pay bills" on payments
for insert with check (tenant_id = auth.uid() and bill_id in (select id from bills where rental_id in (select id from rentals where tenant_id = auth.uid() and status='approved')));

create policy "landlord can read payments" on payments
for select using (landlord_id = auth.uid());

-- =====================================
-- Conversations & Messages
-- Only approved rental participants can see/write
-- =====================================
create policy "conversation access" on conversations
for select using (tenant_id = auth.uid() or landlord_id = auth.uid());

create policy "message access" on messages
for all using (exists (select 1 from conversations c where c.id = conversation_id and (c.tenant_id = auth.uid() or c.landlord_id = auth.uid())));

-- =====================================
-- Activity Logs: Only landlord for their rentals, tenant for own
-- =====================================
create policy "tenant can view own logs" on activity_logs
for select using (rental_id in (select id from rentals where tenant_id = auth.uid()));

create policy "landlord can view logs" on activity_logs
for select using (rental_id in (select id from rentals where landlord_id = auth.uid()));

-- =====================================
-- 10. Documents: Tenant can manage own, landlord can view/manage for their rentals
-- =====================================
create policy "tenant can manage own documents" on documents
for all using (auth.uid() = tenant_id);

create policy "landlord can view/manage rental documents" on documents
for all using (rental_id in (select id from rentals where landlord_id = auth.uid()));

-- =====================================
-- 12. Maintenance Requests: Tenant can create for own rental, landlord can manage
-- =====================================
create policy "tenant can manage own requests" on maintenance_requests
for all using (rental_id in (select id from rentals where tenant_id = auth.uid()));

create policy "landlord can manage requests" on maintenance_requests
for all using (rental_id in (select id from rentals where landlord_id = auth.uid()));
