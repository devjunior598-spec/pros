-- Add missing columns to properties table to match frontend types
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
ADD COLUMN IF NOT EXISTS square_footage INTEGER,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Add missing columns to profiles table to match frontend types
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload config';
