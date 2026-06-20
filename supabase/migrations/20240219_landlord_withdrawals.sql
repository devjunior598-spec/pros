-- Migration: Landlord Withdrawals System
-- Date: 2024-02-19

-- 1. Create Bank Accounts Table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC NOT NULL,
    bank_account_id UUID REFERENCES public.bank_accounts(id),
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    reference TEXT UNIQUE, -- Optional external reference
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Bank Accounts

-- Landlords can view their own bank accounts
CREATE POLICY "Landlords can view own bank accounts" ON public.bank_accounts
FOR SELECT USING (auth.uid() = landlord_id);

-- Landlords can insert their own bank accounts
CREATE POLICY "Landlords can add bank accounts" ON public.bank_accounts
FOR INSERT WITH CHECK (auth.uid() = landlord_id);

-- Landlords can update their own bank accounts
CREATE POLICY "Landlords can update own bank accounts" ON public.bank_accounts
FOR UPDATE USING (auth.uid() = landlord_id);

-- Landlords can delete their own bank accounts
CREATE POLICY "Landlords can delete own bank accounts" ON public.bank_accounts
FOR DELETE USING (auth.uid() = landlord_id);


-- 5. Policies for Withdrawals

-- Landlords can view their own withdrawals
CREATE POLICY "Landlords can view own withdrawals" ON public.withdrawals
FOR SELECT USING (auth.uid() = landlord_id);

-- Landlords can request withdrawals
CREATE POLICY "Landlords can request withdrawals" ON public.withdrawals
FOR INSERT WITH CHECK (auth.uid() = landlord_id);

-- 6. Refresh Cache
NOTIFY pgrst, 'reload config';
