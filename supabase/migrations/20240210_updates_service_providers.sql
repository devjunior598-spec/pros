-- Add Location and Online Status to Service Providers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Seed Data: Update existing providers with random locations in Lagos and Abuja
-- Lagos Base: 6.5244, 3.3792
-- Abuja Base: 9.0765, 7.3986

UPDATE public.service_providers
SET 
    latitude = CASE 
        WHEN service_area = 'Lagos' THEN 6.5244 + (random() * 0.1 - 0.05)
        WHEN service_area = 'Abuja' THEN 9.0765 + (random() * 0.1 - 0.05)
        ELSE 6.5244 + (random() * 0.1 - 0.05)
    END,
    longitude = CASE 
        WHEN service_area = 'Lagos' THEN 3.3792 + (random() * 0.1 - 0.05)
        WHEN service_area = 'Abuja' THEN 7.3986 + (random() * 0.1 - 0.05)
        ELSE 3.3792 + (random() * 0.1 - 0.05)
    END,
    is_online = (random() > 0.5); -- 50% chance of being online

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
