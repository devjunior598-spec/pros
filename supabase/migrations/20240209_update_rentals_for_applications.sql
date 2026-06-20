-- Update rentals table to support pending applications
BEGIN;

-- 1. Make start_date nullable (pending applications don't have a start date yet)
ALTER TABLE public.rentals ALTER COLUMN start_date DROP NOT NULL;

-- 2. Update status defaults and constraints
ALTER TABLE public.rentals ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Add rent_amount column if it doesn't exist (to snapshot the rent at time of application)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentals' AND column_name='rent_amount') THEN
        ALTER TABLE public.rentals ADD COLUMN rent_amount NUMERIC;
    END IF;
END $$;

COMMIT;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
