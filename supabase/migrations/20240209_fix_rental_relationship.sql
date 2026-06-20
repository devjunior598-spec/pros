-- Fix Foreign Key relationship to enable joins between rentals and profiles
-- Currently rentals.tenant_id references auth.users, but we need it to reference public.profiles
-- for Supabase Client .select(..., tenant:profiles(...)) to work automatically.

BEGIN;

-- 1. Drop the existing constraint
ALTER TABLE public.rentals
DROP CONSTRAINT IF EXISTS rentals_tenant_id_fkey;

-- 2. Add new constraint referencing profiles
ALTER TABLE public.rentals
ADD CONSTRAINT rentals_tenant_id_fkey
FOREIGN KEY (tenant_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

COMMIT;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
