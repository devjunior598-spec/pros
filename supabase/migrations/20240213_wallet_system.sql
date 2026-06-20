-- Migration: Wallet System
-- Date: 2024-02-13

-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    balance NUMERIC DEFAULT 0 NOT NULL,
    virtual_account_number TEXT,
    bank_name TEXT,
    account_name TEXT,
    paystack_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
    amount NUMERIC NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Update Bills Check Constraint
-- Note: Postgres doesn't allow direct modification of CHECK constraints easily if unnamed.
-- We'll drop and recreate or just add a new one if it's named. 
-- In the original schema.sql, there was a check constraint.
-- Let's try to update the type column to allow more types.
ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_type_check;
ALTER TABLE public.bills ADD CONSTRAINT bills_type_check CHECK (type IN ('rent', 'electricity', 'water', 'service', 'custom', 'light', 'gas', 'waste'));

-- 4. Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Tenants can view their own wallet
CREATE POLICY "Tenants can view own wallet" ON public.wallets 
FOR SELECT USING (auth.uid() = tenant_id);

-- Tenants can view their own transactions
CREATE POLICY "Tenants can view own transactions" ON public.transactions 
FOR SELECT USING (auth.uid() = tenant_id);

-- 6. Refresh Cache
NOTIFY pgrst, 'reload config';
