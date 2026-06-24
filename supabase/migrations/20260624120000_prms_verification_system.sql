-- 1. Create landlord_kyc table
CREATE TABLE IF NOT EXISTS public.landlord_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    id_type TEXT CHECK (id_type IN ('NIN', 'Driver''s License', 'Passport', 'Voter''s Card')) NOT NULL,
    id_number TEXT NOT NULL,
    id_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    cac_url TEXT,
    address_proof_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create property_verifications table
CREATE TABLE IF NOT EXISTS public.property_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    ownership_doc_url TEXT NOT NULL,
    agency_agreement_url TEXT NOT NULL,
    property_photos TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create public.tenant_kyc if not exists, then update it with employment and emergency contact columns
CREATE TABLE IF NOT EXISTS public.tenant_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    id_type TEXT CHECK (id_type IN ('NIN', 'Driver''s License', 'Passport', 'Voter''s Card')) NOT NULL,
    id_number TEXT NOT NULL,
    id_image_url TEXT NOT NULL,
    selfie_image_url TEXT NOT NULL,
    address TEXT NOT NULL,
    dob DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tenant_kyc ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own kyc" ON public.tenant_kyc;
CREATE POLICY "Tenants can view own kyc" ON public.tenant_kyc FOR SELECT USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Tenants can insert own kyc" ON public.tenant_kyc;
CREATE POLICY "Tenants can insert own kyc" ON public.tenant_kyc FOR INSERT WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Admins can manage all kyc" ON public.tenant_kyc;
CREATE POLICY "Admins can manage all kyc" ON public.tenant_kyc FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'admin@example.com')
    )
);

ALTER TABLE public.tenant_kyc 
ADD COLUMN IF NOT EXISTS employment_company TEXT,
ADD COLUMN IF NOT EXISTS employment_position TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- 4. Enable RLS on newly created tables
ALTER TABLE public.landlord_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_verifications ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies for landlord_kyc
DROP POLICY IF EXISTS "Landlords can view own kyc" ON public.landlord_kyc;
CREATE POLICY "Landlords can view own kyc" ON public.landlord_kyc
    FOR SELECT USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can insert own kyc" ON public.landlord_kyc;
CREATE POLICY "Landlords can insert own kyc" ON public.landlord_kyc
    FOR INSERT WITH CHECK (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Admins can manage all landlord kyc" ON public.landlord_kyc;
CREATE POLICY "Admins can manage all landlord kyc" ON public.landlord_kyc
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6. Define RLS Policies for property_verifications
DROP POLICY IF EXISTS "Landlords can view own property verifications" ON public.property_verifications;
CREATE POLICY "Landlords can view own property verifications" ON public.property_verifications
    FOR SELECT USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can insert own property verifications" ON public.property_verifications;
CREATE POLICY "Landlords can insert own property verifications" ON public.property_verifications
    FOR INSERT WITH CHECK (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Admins can manage all property verifications" ON public.property_verifications;
CREATE POLICY "Admins can manage all property verifications" ON public.property_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Initialize Private Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('landlord-documents', 'landlord-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-documents', 'tenant-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', false) ON CONFLICT (id) DO NOTHING;

-- 8. Storage Buckets RLS Policies (restrict to owner and admin)
DROP POLICY IF EXISTS "Access landlord docs" ON storage.objects;
CREATE POLICY "Access landlord docs" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'landlord-documents' AND (
        auth.uid() = owner OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

DROP POLICY IF EXISTS "Upload landlord docs" ON storage.objects;
CREATE POLICY "Upload landlord docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'landlord-documents');

DROP POLICY IF EXISTS "Access tenant docs" ON storage.objects;
CREATE POLICY "Access tenant docs" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'tenant-documents' AND (
        auth.uid() = owner OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

DROP POLICY IF EXISTS "Upload tenant docs" ON storage.objects;
CREATE POLICY "Upload tenant docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tenant-documents');

DROP POLICY IF EXISTS "Access property docs" ON storage.objects;
CREATE POLICY "Access property docs" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'property-documents' AND (
        auth.uid() = owner OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

DROP POLICY IF EXISTS "Upload property docs" ON storage.objects;
CREATE POLICY "Upload property docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-documents');

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
