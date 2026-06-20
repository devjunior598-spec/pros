-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    type TEXT NOT NULL, -- 'id_card', 'lease_agreement', 'proof_of_payment', 'other'
    tenant_id UUID REFERENCES auth.users(id) NOT NULL,
    rental_id UUID REFERENCES public.rentals(id),
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DO $$ 
BEGIN
    -- Tenants can view their own documents
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Tenants can view own documents') THEN
        CREATE POLICY "Tenants can view own documents" ON public.documents 
        FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = uploaded_by);
    END IF;

    -- Tenants can upload their own documents
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Tenants can upload own documents') THEN
        CREATE POLICY "Tenants can upload own documents" ON public.documents 
        FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
    END IF;

    -- Landlords can view documents for their rentals
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Landlords can view related documents') THEN
        CREATE POLICY "Landlords can view related documents" ON public.documents 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.rentals r
                JOIN public.properties p ON r.property_id = p.id
                WHERE r.id = documents.rental_id AND p.landlord_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 4. Storage Bucket (Instructional - Supabase usually requires this via UI or specific API)
-- Note: In a real production setup with Supabase CLI, we'd use:
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

-- 5. Refresh Cache
NOTIFY pgrst, 'reload config';
