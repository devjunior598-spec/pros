-- Migration: Tenant KYC and Profile Updates
-- Date: 2024-02-13

-- 1. Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 2. Create tenant_kyc table
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

-- 3. Enable RLS
ALTER TABLE public.tenant_kyc ENABLE ROW LEVEL SECURITY;

-- Policies for tenant_kyc
-- Tenants can view their own KYC records
CREATE POLICY "Tenants can view own kyc" 
ON public.tenant_kyc FOR SELECT 
USING (auth.uid() = tenant_id);

-- Tenants can insert their own KYC records
CREATE POLICY "Tenants can insert own kyc" 
ON public.tenant_kyc FOR INSERT 
WITH CHECK (auth.uid() = tenant_id);

-- Admins can view and update all KYC records
-- Assuming an 'admin' role might be added later, or just check role in profiles
CREATE POLICY "Admins can manage all kyc" 
ON public.tenant_kyc FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.email = 'admin@example.com') -- Temporary admin check
    )
);

-- 4. Create Storage Buckets
-- Public bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_images', 'profile_images', true)
ON CONFLICT (id) DO NOTHING;

-- Private bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Profile Images: Public Read
CREATE POLICY "Profile images are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_images');

-- Profile Images: Users can upload their own
CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile_images');

CREATE POLICY "Users can update/delete own profile image"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'profile_images' AND auth.uid() = owner);

-- KYC Documents: Private (Only owner or admin)
CREATE POLICY "Only owners or admins can access KYC docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'kyc_documents' 
    AND (
        auth.uid() = owner 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.email = 'admin@example.com')
        )
    )
);

CREATE POLICY "Users can upload KYC docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc_documents');

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
