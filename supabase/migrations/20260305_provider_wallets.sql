-- Migration: Provider Wallets & Payout Infrastructure
-- Date: 2026-03-05

-- 1. Create Provider Wallets Table
CREATE TABLE IF NOT EXISTS public.provider_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    balance NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Provider Transactions Table
CREATE TABLE IF NOT EXISTS public.provider_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
    amount NUMERIC NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Modify existing withdrawal/bank tables to support providers
-- Make landlord_id nullable in bank_accounts if it isn't already, add provider_id
ALTER TABLE public.bank_accounts ALTER COLUMN landlord_id DROP NOT NULL;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES auth.users(id);

-- Make landlord_id nullable in withdrawals if it isn't already, add provider_id
ALTER TABLE public.withdrawals ALTER COLUMN landlord_id DROP NOT NULL;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES auth.users(id);

-- 4. Enable RLS
ALTER TABLE public.provider_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Providers can view their own wallet
CREATE POLICY "Providers can view own wallet" ON public.provider_wallets 
FOR SELECT USING (auth.uid() = provider_id);

-- Providers can view their own transactions
CREATE POLICY "Providers can view own transactions" ON public.provider_transactions 
FOR SELECT USING (auth.uid() = provider_id);

-- Trigger to update updated_at on provider_wallets
CREATE OR REPLACE FUNCTION update_provider_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_provider_wallets_updated_at ON public.provider_wallets;
CREATE TRIGGER trg_provider_wallets_updated_at
BEFORE UPDATE ON public.provider_wallets
FOR EACH ROW
EXECUTE FUNCTION update_provider_wallet_updated_at();

-- 6. Refresh Cache
NOTIFY pgrst, 'reload config';
