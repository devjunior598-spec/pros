-- Add application_letter and application_letter_url to rentals table
BEGIN;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rentals' AND column_name='application_letter') THEN
        ALTER TABLE public.rentals ADD COLUMN application_letter TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rentals' AND column_name='application_letter_url') THEN
        ALTER TABLE public.rentals ADD COLUMN application_letter_url TEXT;
    END IF;
END $$;

COMMIT;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
