-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    rental_id UUID REFERENCES public.rentals(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
    images TEXT[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Policies

-- Tenants can view their own requests
CREATE POLICY "Tenants can view own maintenance requests" 
ON public.maintenance_requests 
FOR SELECT 
USING (auth.uid() = tenant_id);

-- Tenants can insert their own requests (must be linked to a valid rental they own)
CREATE POLICY "Tenants can insert own maintenance requests" 
ON public.maintenance_requests 
FOR INSERT 
WITH CHECK (
    auth.uid() = tenant_id 
    AND 
    EXISTS (
        SELECT 1 FROM public.rentals 
        WHERE rentals.id = maintenance_requests.rental_id 
        AND rentals.tenant_id = auth.uid()
    )
);

-- Landlords can view requests for their properties
-- This requires joining through rentals -> properties -> owner (landlord_id)
CREATE POLICY "Landlords can view requests for their properties" 
ON public.maintenance_requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.rentals
        JOIN public.properties ON rentals.property_id = properties.id
        WHERE rentals.id = maintenance_requests.rental_id
        AND properties.landlord_id = auth.uid()
    )
);

-- Landlords can update requests for their properties (e.g. change status)
CREATE POLICY "Landlords can update requests for their properties" 
ON public.maintenance_requests 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.rentals
        JOIN public.properties ON rentals.property_id = properties.id
        WHERE rentals.id = maintenance_requests.rental_id
        AND properties.landlord_id = auth.uid()
    )
);

-- Notify purely for visual confirmation if running via SQL editor
NOTIFY pgrst, 'reload config';
