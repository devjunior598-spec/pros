-- Add explicit Foreign Key constraint to public.profiles for documents
-- This allows PostgREST to join documents with profiles (for tenant name/email)

DO $$
BEGIN
    -- Add FK for tenant_id to profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'documents_tenant_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.documents
        ADD CONSTRAINT documents_tenant_id_fkey_profiles
        FOREIGN KEY (tenant_id) REFERENCES public.profiles(id);
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
