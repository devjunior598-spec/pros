-- Migration: Service Provider Marketplace
-- Date: 2024-02-14

-- 1. Create service_providers table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    category TEXT NOT NULL, -- e.g., 'Plumbing', 'Electrical', etc.
    location TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create repair_assignments table
CREATE TABLE IF NOT EXISTS public.repair_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
    landlord_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    cost_estimate NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for service_providers
-- Anyone authenticated can view service providers
CREATE POLICY "Anyone can view service providers" 
ON public.service_providers FOR SELECT 
TO authenticated 
USING (true);

-- Policies for repair_assignments
-- Landlords can manage assignments for their own requests
CREATE POLICY "Landlords can manage own repair assignments" 
ON public.repair_assignments FOR ALL 
TO authenticated 
USING (auth.uid() = landlord_id);

-- Tenants can view assignments for their own requests
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

-- 4. Seed initial service providers
INSERT INTO public.service_providers (full_name, phone, email, category, location, rating, verified)
VALUES 
('Obinna Plumbing Services', '08012345678', 'obinna@example.com', 'Plumbing', 'Lagos', 4.8, true),
('Tunde Electricals', '08087654321', 'tunde@example.com', 'Electrical', 'Abuja', 4.5, true),
('Ikeja Handy Hands', '08123456789', 'handy@example.com', 'General Handyman', 'Lagos', 4.2, false),
('Swift AC Repairs', '09012345678', 'swift@example.com', 'AC Repair', 'Port Harcourt', 4.9, true),
('Solid Carpentry', '07012345678', 'solid@example.com', 'Carpentry', 'Ibadan', 4.6, true);

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
