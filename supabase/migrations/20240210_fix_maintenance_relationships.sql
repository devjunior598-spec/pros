-- Add explicit Foreign Key constraint to public.profiles for maintenance requests
-- This allows PostgREST to join maintenance_requests with profiles (for tenant name)

DO $$
BEGIN
    -- Add FK for tenant_id to profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'maintenance_requests_tenant_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.maintenance_requests
        ADD CONSTRAINT maintenance_requests_tenant_id_fkey_profiles
        FOREIGN KEY (tenant_id) REFERENCES public.profiles(id);
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
