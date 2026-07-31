ALTER TABLE public.wallets
    ADD COLUMN IF NOT EXISTS auto_refill_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS auto_refill_threshold NUMERIC NOT NULL DEFAULT 5000,
    ADD COLUMN IF NOT EXISTS auto_refill_amount NUMERIC NOT NULL DEFAULT 20000,
    ADD COLUMN IF NOT EXISTS paystack_authorization_code TEXT,
    ADD COLUMN IF NOT EXISTS payment_card_last4 TEXT,
    ADD COLUMN IF NOT EXISTS payment_card_brand TEXT,
    ADD COLUMN IF NOT EXISTS auto_refill_last_attempt_at TIMESTAMPTZ;

ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_auto_refill_values_check;
ALTER TABLE public.wallets ADD CONSTRAINT wallets_auto_refill_values_check
CHECK (auto_refill_threshold >= 0 AND auto_refill_amount >= 1000);

NOTIFY pgrst, 'reload schema';
