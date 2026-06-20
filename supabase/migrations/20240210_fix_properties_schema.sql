-- Add missing columns to properties table to match frontend types
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC;

-- Optionally copy data from old columns if they exist and are not null
-- (Assuming monthly_rent maps to price)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'monthly_rent') THEN
        UPDATE public.properties SET price = monthly_rent WHERE price IS NULL;
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
