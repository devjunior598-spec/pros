-- Add more fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload config';
