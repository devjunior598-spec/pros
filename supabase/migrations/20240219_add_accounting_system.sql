-- Migration: Double-Entry Accounting System
-- Description: Adds tables for accounts, journal entries, and lines to support accurate financial tracking.

-- 1. Chart of Accounts
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    code TEXT UNIQUE NOT NULL, -- e.g. "1001"
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')) NOT NULL,
    description TEXT,
    balance NUMERIC DEFAULT 0 NOT NULL, -- Cached balance, updated via triggers/RPC
    is_system BOOLEAN DEFAULT false, -- If true, cannot be deleted (e.g. System Bank, Wallet Liability)
    currency TEXT DEFAULT 'NGN'
);

-- 2. Journal Entries (The Transaction Header)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference_id UUID, -- Link to payment, invoice, bill, etc.
    reference_type TEXT, -- 'payment', 'bill', 'withdrawal', 'refund'
    metadata JSONB -- Extra details
);

-- 3. Journal Lines (The Splits)
CREATE TABLE IF NOT EXISTS public.journal_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.accounts(id) NOT NULL,
    debit NUMERIC DEFAULT 0 NOT NULL,
    credit NUMERIC DEFAULT 0 NOT NULL,
    description TEXT,
    CONSTRAINT positive_amounts CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT has_amount CHECK (debit > 0 OR credit > 0)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry_id ON public.journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account_id ON public.journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(date);

-- 4. RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin has full access
CREATE POLICY "Admins can view all accounts" ON public.accounts FOR SELECT USING (
    -- Assuming admin check via logic or specific role claim. For now, open to authenticated for viewing reporting/dashboards if roles not strict yet.
    -- Strict implementation: auth.jwt() ->> 'role' = 'admin' OR specific user list
    auth.role() = 'authenticated'
);

-- 5. Seed Default Accounts (Idempotent)
INSERT INTO public.accounts (code, name, type, description, is_system) VALUES
('1001', 'Platform Bank Account', 'asset', 'Main operating bank account', true),
('1002', 'Payment Gateway Clearing', 'asset', 'Funds held by Paystack/Flutterwave', true),
('2001', 'Tenant Wallet Liability', 'liability', 'Funds held on behalf of tenants', true),
('2002', 'Landlord Wallet Liability', 'liability', 'Funds held on behalf of landlords', true),
('2003', 'Service Provider Payable', 'liability', 'Funds owed to service providers', true),
('3001', 'Opening Balance Equity', 'equity', 'Initial system balances', true),
('3002', 'Retained Earnings', 'equity', 'Accumulated profits', true),
('4001', 'Commission Revenue', 'income', 'Platform fees from transactions', true),
('4002', 'Subscription Revenue', 'income', 'Monthly SaaS fees', true),
('4003', 'Late Fee Revenue', 'income', 'Collected late fees (if platform keeps)', true),
('5001', 'Payment Processing Fees', 'expense', 'Fees charged by gateway', true),
('5002', 'Refund Expense', 'expense', 'Cost of refunds', true)
ON CONFLICT (code) DO NOTHING;

-- 6. RPC to Record Entry Safely
CREATE OR REPLACE FUNCTION public.record_journal_entry(
    p_date DATE,
    p_description TEXT,
    p_lines JSONB, -- Array of {account_id, debit, credit, description}
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry_id UUID;
    v_line JSONB;
    v_total_debit NUMERIC := 0;
    v_total_credit NUMERIC := 0;
BEGIN
    -- Validate Balance
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
        v_total_debit := v_total_debit + COALESCE((v_line->>'debit')::NUMERIC, 0);
        v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::NUMERIC, 0);
    END LOOP;

    IF v_total_debit <> v_total_credit THEN
        RAISE EXCEPTION 'Journal Entry does not balance. Debit: %, Credit: %', v_total_debit, v_total_credit;
    END IF;

    -- Create Entry
    INSERT INTO public.journal_entries (date, description, reference_id, reference_type, metadata)
    VALUES (p_date, p_description, p_reference_id, p_reference_type, p_metadata)
    RETURNING id INTO v_entry_id;

    -- Create Lines and Update Account Balances
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
        INSERT INTO public.journal_lines (entry_id, account_id, debit, credit, description)
        VALUES (
            v_entry_id,
            (v_line->>'account_id')::UUID,
            COALESCE((v_line->>'debit')::NUMERIC, 0),
            COALESCE((v_line->>'credit')::NUMERIC, 0),
            v_line->>'description'
        );

        -- Update Account Balance (Simple approach: +Debit -Credit for Assets/Expenses, -Debit +Credit for Liabilities/Equity/Income)
        -- Actually simplistic approach: Store raw balance and calculate reporting dynamic, OR
        -- Standard convention: Balance = Sum(Debits) - Sum(Credits). 
        -- Interpretation depends on account type.
        UPDATE public.accounts
        SET balance = balance + COALESCE((v_line->>'debit')::NUMERIC, 0) - COALESCE((v_line->>'credit')::NUMERIC, 0)
        WHERE id = (v_line->>'account_id')::UUID;
    END LOOP;

    RETURN v_entry_id;
END;
$$;

NOTIFY pgrst, 'reload config';
