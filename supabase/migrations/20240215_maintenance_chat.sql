-- Migration: Maintenance Chat System
-- Date: 2024-02-15

CREATE TABLE IF NOT EXISTS public.maintenance_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    message TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.maintenance_messages ENABLE ROW LEVEL SECURITY;

-- Landlords, Tenants, and Providers involved in the request can view messages
CREATE POLICY "Users can view messages" 
ON public.maintenance_messages FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        LEFT JOIN public.properties p ON mr.property_id = p.id
        LEFT JOIN public.repair_assignments ra ON mr.id = ra.request_id
        LEFT JOIN public.service_providers sp ON ra.provider_id = sp.id
        WHERE mr.id = maintenance_messages.request_id
        AND (
            mr.tenant_id = auth.uid() OR 
            p.landlord_id = auth.uid() OR
            sp.user_id = auth.uid()
        )
    )
);

-- Users can insert messages if they are involved
CREATE POLICY "Users can send messages" 
ON public.maintenance_messages FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        LEFT JOIN public.properties p ON mr.property_id = p.id
        LEFT JOIN public.repair_assignments ra ON mr.id = ra.request_id
        LEFT JOIN public.service_providers sp ON ra.provider_id = sp.id
        WHERE mr.id = maintenance_messages.request_id
        AND (
            mr.tenant_id = auth.uid() OR 
            p.landlord_id = auth.uid() OR
            sp.user_id = auth.uid()
        )
    )
);

-- Notify schema cache
NOTIFY pgrst, 'reload config';
