-- Consolidated Service Providers Migration
-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    service_area TEXT NOT NULL,
    description TEXT,
    rating NUMERIC DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    image_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_online BOOLEAN DEFAULT false
);

-- 2. Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_providers' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.service_providers FOR SELECT USING (true);
    END IF;
END $$;

-- 4. Seed Data (Only if empty)
INSERT INTO public.service_providers (name, category, phone, whatsapp, service_area, description, is_verified, rating, review_count, latitude, longitude, is_online)
SELECT 
    'FixItAll Handyman Services', 'General Repairs', '+234 800 111 2222', '+234 800 111 2222', 'Lagos', 'Handyman services, home maintenance.', true, 4.8, 12, 6.5244, 3.3792, true
WHERE NOT EXISTS (SELECT 1 FROM public.service_providers LIMIT 1);

INSERT INTO public.service_providers (name, category, phone, whatsapp, service_area, description, is_verified, rating, review_count, latitude, longitude, is_online)
SELECT 
    'ProFlow Plumbers', 'Plumbing Works', '+234 800 222 3333', '+234 800 222 3333', 'Lagos', 'Fixing leaking taps and pipes.', true, 4.9, 25, 6.5355, 3.3888, true
WHERE NOT EXISTS (SELECT 1 FROM public.service_providers WHERE name = 'ProFlow Plumbers');

INSERT INTO public.service_providers (name, category, phone, whatsapp, service_area, description, is_verified, rating, review_count, latitude, longitude, is_online)
SELECT 
    'SparkBright Electricals', 'Electrical Works', '+234 800 333 4444', '+234 800 333 4444', 'Lagos', 'Wiring and rewiring.', true, 4.7, 30, 6.5000, 3.3500, false
WHERE NOT EXISTS (SELECT 1 FROM public.service_providers WHERE name = 'SparkBright Electricals');

-- 5. Update existing rows with location if they are null (in case table existed but columns were added)
UPDATE public.service_providers
SET 
    latitude = CASE 
        WHEN latitude IS NOT NULL THEN latitude
        WHEN service_area = 'Lagos' THEN 6.5244 + (random() * 0.1 - 0.05)
        WHEN service_area = 'Abuja' THEN 9.0765 + (random() * 0.1 - 0.05)
        ELSE 6.5244 + (random() * 0.1 - 0.05)
    END,
    longitude = CASE 
        WHEN longitude IS NOT NULL THEN longitude
        WHEN service_area = 'Lagos' THEN 3.3792 + (random() * 0.1 - 0.05)
        WHEN service_area = 'Abuja' THEN 7.3986 + (random() * 0.1 - 0.05)
        ELSE 3.3792 + (random() * 0.1 - 0.05)
    END,
    is_online = CASE
        WHEN is_online IS NOT NULL THEN is_online
        ELSE (random() > 0.5)
    END;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
