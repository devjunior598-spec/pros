-- Add explicit Foreign Key constraints to public.profiles to allow PostgREST joins
-- We need to drop existing FKs if they conflict, but simpler to just add new ones or alter.
-- However, since landlord_id already REFERENCES auth.users, adding another reference might be redundant but necessary for PostgREST.
-- Actually, the cleaner way for Supabase is to reference public.profiles directly if that's what we query.
-- But since data is already consistent (profiles.id = auth.users.id), we can add the constraint.

DO $$
BEGIN
    -- Add FK for landlord_id to profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_landlord_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.conversations
        ADD CONSTRAINT conversations_landlord_id_fkey_profiles
        FOREIGN KEY (landlord_id) REFERENCES public.profiles(id);
    END IF;

    -- Add FK for tenant_id to profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_tenant_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.conversations
        ADD CONSTRAINT conversations_tenant_id_fkey_profiles
        FOREIGN KEY (tenant_id) REFERENCES public.profiles(id);
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
