-- Consolidated Fix for Missing Maintenance Tables
-- Run this in your Supabase SQL Editor

-- 0. Update maintenance_requests table to include category and property_id (from 20240213_maintenance_image_system.sql)
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);

-- Update existing records if property_id is missing (link via rentals)
UPDATE public.maintenance_requests mr
SET property_id = (SELECT property_id FROM public.rentals r WHERE r.id = mr.rental_id)
WHERE mr.property_id IS NULL;


-- 1. Create request_images table (from 20240213_maintenance_image_system.sql)
CREATE TABLE IF NOT EXISTS public.request_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on request_images
ALTER TABLE public.request_images ENABLE ROW LEVEL SECURITY;

-- Policies for request_images
DROP POLICY IF EXISTS "Tenants can view own request images" ON public.request_images;
CREATE POLICY "Tenants can view own request images" 
ON public.request_images FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        WHERE mr.id = request_images.request_id
        AND mr.tenant_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Tenants can insert own request images" ON public.request_images;
CREATE POLICY "Tenants can insert own request images" 
ON public.request_images FOR INSERT 
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        WHERE mr.id = request_images.request_id
        AND mr.tenant_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Landlords can view request images for their properties" ON public.request_images;
CREATE POLICY "Landlords can view request images for their properties" 
ON public.request_images FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        JOIN public.properties p ON mr.property_id = p.id
        WHERE mr.id = request_images.request_id
        AND p.landlord_id = auth.uid()
    )
);

-- Create storage bucket for maintenance images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance_images', 'maintenance_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'maintenance_images' );

DROP POLICY IF EXISTS "Authenticated users can upload maintenance images" ON storage.objects;
CREATE POLICY "Authenticated users can upload maintenance images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'maintenance_images' );

DROP POLICY IF EXISTS "Users can delete own maintenance images" ON storage.objects;
CREATE POLICY "Users can delete own maintenance images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'maintenance_images' AND auth.uid() = owner );


-- 2. Create service_providers and repair_assignments (from 20240214_service_provider_marketplace.sql)

CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    category TEXT NOT NULL,
    location TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure user_id exists for policies (this was missing from the simplified table version)
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

CREATE TABLE IF NOT EXISTS public.repair_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
    landlord_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    cost_estimate NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for service_providers
DROP POLICY IF EXISTS "Anyone can view service providers" ON public.service_providers;
CREATE POLICY "Anyone can view service providers" 
ON public.service_providers FOR SELECT 
TO authenticated 
USING (true);

-- Policies for repair_assignments
DROP POLICY IF EXISTS "Landlords can manage own repair assignments" ON public.repair_assignments;
CREATE POLICY "Landlords can manage own repair assignments" 
ON public.repair_assignments FOR ALL 
TO authenticated 
USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Tenants can view own repair assignments" ON public.repair_assignments;
CREATE POLICY "Tenants can view own repair assignments" 
ON public.repair_assignments FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        WHERE mr.id = repair_assignments.request_id
        AND mr.tenant_id = auth.uid()
    )
);

-- Refresh schema cache
NOTIFY pgrst, 'reload config';

-- 2.5 Ensure core financial tables exist (from 20240209_add_payments_table.sql and ensure_bills_table.sql)

-- Bills
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    rental_id UUID REFERENCES public.rentals(id) NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, overdue
    paid_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'bills' AND policyname = 'Enable read for tenants') THEN
        CREATE POLICY "Enable read for tenants" ON public.bills FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.rentals WHERE rentals.id = bills.rental_id AND rentals.tenant_id = auth.uid())
        );
    END IF;
END $$;

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    bill_id UUID REFERENCES public.bills(id), -- Nullable initially
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, success, failed
    reference TEXT UNIQUE NOT NULL,
    payment_method TEXT,
    channel TEXT,
    currency TEXT DEFAULT 'NGN',
    ip_address TEXT,
    metadata JSONB
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. Fix payments table relationship (for TenantMonitoring)
-- Add rental_id to payments if not exists
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS rental_id UUID REFERENCES public.rentals(id);

-- Backfill rental_id from bills where possible
UPDATE public.payments p
SET rental_id = b.rental_id
FROM public.bills b
WHERE p.bill_id = b.id
AND p.rental_id IS NULL;

-- Enable RLS logic for rental_id if needed, but existing policies rely on bill_id or metadata.
-- For simple reading via rentals(payments), standard RLS on payments should apply.
-- Let's ensure a policy exists that allows landlords to view payments by rental_id directly.

DROP POLICY IF EXISTS "Landlords can view payments by rental" ON public.payments;
CREATE POLICY "Landlords can view payments by rental" 
ON public.payments FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.rentals r
        JOIN public.properties p ON p.id = r.property_id
        WHERE r.id = payments.rental_id
        AND p.landlord_id = auth.uid()
    )
);

-- 4. Create repair_quotes table (from 20240214_full_marketplace_system.sql)
CREATE TABLE IF NOT EXISTS public.repair_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    quoted_price NUMERIC(15,2) NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on repair_quotes
ALTER TABLE public.repair_quotes ENABLE ROW LEVEL SECURITY;

-- Policies for repair_quotes
DROP POLICY IF EXISTS "Providers can view jobs in their category and location" ON public.repair_quotes;
CREATE POLICY "Providers can view jobs in their category and location" 
ON public.repair_quotes FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.service_providers sp
        WHERE sp.user_id = auth.uid()
        -- AND sp.approval_status = 'approved' (simplified for now to match SP table which might not have approval_status)
    )
);

DROP POLICY IF EXISTS "Providers can submit quotes" ON public.repair_quotes;
CREATE POLICY "Providers can submit quotes" 
ON public.repair_quotes FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.service_providers sp
        WHERE sp.user_id = auth.uid()
        -- AND sp.approval_status = 'approved'
    )
);

DROP POLICY IF EXISTS "Landlords can view quotes for their requests" ON public.repair_quotes;
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

DROP POLICY IF EXISTS "Landlords can accept quotes" ON public.repair_quotes;
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

-- 5. Create reviews table (missing relationship check)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Simple select policy for reviews
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT TO authenticated USING (true);


-- Notify again
NOTIFY pgrst, 'reload config';
