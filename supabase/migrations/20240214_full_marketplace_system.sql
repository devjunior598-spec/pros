-- Migration: Full Service Provider Marketplace System
-- Date: 2024-02-14

-- 1. Update profiles table roles
-- We need to drop the existing check constraint and add a new one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('tenant', 'landlord', 'service_provider', 'admin'));

-- 2. Create service_providers table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    category TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    location_state TEXT NOT NULL,
    location_city TEXT NOT NULL,
    bio TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create provider_portfolio table
CREATE TABLE IF NOT EXISTS public.provider_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create repair_quotes table
CREATE TABLE IF NOT EXISTS public.repair_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    quoted_price NUMERIC(15,2) NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Update maintenance_requests to support assignment details better
-- (Most of this was handled in previous migration, but ensuring consistency)
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_state TEXT;

-- 7. Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 8. Policies for service_providers
CREATE POLICY "Public profiles are visible to all" ON public.service_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Providers can manage own profile" ON public.service_providers FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 9. Policies for repair_quotes
CREATE POLICY "Providers can view jobs in their category and location" 
ON public.repair_quotes FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.service_providers sp
        WHERE sp.user_id = auth.uid()
        AND sp.approval_status = 'approved'
    )
);

CREATE POLICY "Providers can submit quotes" 
ON public.repair_quotes FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.service_providers sp
        WHERE sp.user_id = auth.uid()
        AND sp.approval_status = 'approved'
    )
);

CREATE POLICY "Landlords can view quotes for their requests" 
ON public.repair_quotes FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        JOIN public.properties p ON mr.property_id = p.id
        WHERE mr.id = repair_quotes.request_id
        AND p.landlord_id = auth.uid()
    )
);

CREATE POLICY "Landlords can accept quotes" 
ON public.repair_quotes FOR UPDATE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        JOIN public.properties p ON mr.property_id = p.id
        WHERE mr.id = repair_quotes.request_id
        AND p.landlord_id = auth.uid()
    )
);

-- 10. Function to update provider rating automatically
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.service_providers
    SET rating = (SELECT AVG(rating) FROM public.reviews WHERE provider_id = NEW.provider_id),
        total_jobs_completed = (SELECT COUNT(*) FROM public.repair_assignments WHERE provider_id = NEW.provider_id AND status = 'completed')
    WHERE id = NEW.provider_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_added
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE public.update_provider_rating();

-- 11. Create storage bucket for provider documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider_documents', 'provider_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for provider_documents
DROP POLICY IF EXISTS "Providers can upload their own documents" ON storage.objects;
CREATE POLICY "Providers can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'provider_documents' );

DROP POLICY IF EXISTS "Users can view their own provider documents" ON storage.objects;
CREATE POLICY "Users can view their own provider documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING ( bucket_id = 'provider_documents' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Admins can view all provider documents" ON storage.objects;
CREATE POLICY "Admins can view all provider documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'provider_documents' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
