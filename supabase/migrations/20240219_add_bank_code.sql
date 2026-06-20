-- Migration: Add bank_code to bank_accounts
-- Date: 2024-02-19

ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS bank_code TEXT;

-- Refresh Cache
NOTIFY pgrst, 'reload config';
