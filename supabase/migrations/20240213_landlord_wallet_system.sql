-- Migration: Landlord Wallet and Withdrawal System
-- Date: 2024-02-13

-- 1. Create Landlord Wallets Table
CREATE TABLE IF NOT EXISTS public.landlord_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
    balance NUMERIC DEFAULT 0 NOT NULL,
    total_earnings NUMERIC DEFAULT 0 NOT NULL,
    total_withdrawn NUMERIC DEFAULT 0 NOT NULL,
    bank_account_number TEXT,
    bank_name TEXT,
    bank_code TEXT,
    account_name TEXT,
    recipient_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Overhaul Withdrawals Table
-- First, drop the old table if it exists to avoid conflicts with the new schema
DROP TABLE IF EXISTS public.withdrawals;

CREATE TABLE public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
    reference TEXT UNIQUE NOT NULL,
    bank_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Landlord Transactions Table
CREATE TABLE IF NOT EXISTS public.landlord_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.landlord_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Landlords can view own wallet" ON public.landlord_wallets 
FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can view own withdrawals" ON public.withdrawals 
FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can view own transactions" ON public.landlord_transactions 
FOR SELECT USING (auth.uid() = landlord_id);

-- 6. Trigger to credit landlord wallet when a bill is paid
-- We'll replace the old update_landlord_balance function to use the new landlord_wallets table
CREATE OR REPLACE FUNCTION update_landlord_wallet_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_landlord_id UUID;
BEGIN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        -- Find the landlord for this rental
        SELECT landlord_id INTO v_landlord_id FROM rentals WHERE id = NEW.rental_id;
        
        IF v_landlord_id IS NOT NULL THEN
            -- Ensure landlord_wallet exists
            INSERT INTO public.landlord_wallets (landlord_id, balance, total_earnings)
            VALUES (v_landlord_id, NEW.amount, NEW.amount)
            ON CONFLICT (landlord_id) DO UPDATE
            SET balance = landlord_wallets.balance + EXCLUDED.balance,
                total_earnings = landlord_wallets.total_earnings + EXCLUDED.total_earnings;
                
            -- Log transaction
            INSERT INTO public.landlord_transactions (landlord_id, type, amount, description, reference)
            VALUES (v_landlord_id, 'credit', NEW.amount, 'Rent payment received', 'pmt-' || NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to bills table
DROP TRIGGER IF EXISTS on_bill_paid ON bills;
CREATE TRIGGER on_bill_paid
    AFTER UPDATE ON bills
    FOR EACH ROW
    EXECUTE PROCEDURE update_landlord_wallet_on_payment();

-- 7. Refresh Cache
NOTIFY pgrst, 'reload config';
