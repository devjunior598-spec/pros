-- Migration: Provider Permissions
-- Date: 2024-02-15

-- Allow providers to update status of maintenance requests they are assigned to
CREATE POLICY "Providers can update status of assigned requests" 
ON public.maintenance_requests FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.repair_assignments ra
        JOIN public.service_providers sp ON ra.provider_id = sp.id
        WHERE ra.request_id = maintenance_requests.id
        AND sp.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.repair_assignments ra
        JOIN public.service_providers sp ON ra.provider_id = sp.id
        WHERE ra.request_id = maintenance_requests.id
        AND sp.user_id = auth.uid()
    )
);

-- Notify schema cache
NOTIFY pgrst, 'reload config';
