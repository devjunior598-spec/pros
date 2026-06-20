-- Migration: Maintenance System Enhancements
-- Date: 2024-02-15

-- 1. Update maintenance_requests table
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS final_cost NUMERIC(15,2);

-- 2. Create maintenance_status_logs table
CREATE TABLE IF NOT EXISTS public.maintenance_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id), -- Nullable if system change, but usually user
    previous_status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.maintenance_status_logs ENABLE ROW LEVEL SECURITY;

-- Policies for maintenance_status_logs
-- Landlords can view logs for their properties
CREATE POLICY "Landlords can view logs for their properties" 
ON public.maintenance_status_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        JOIN public.properties p ON mr.property_id = p.id
        WHERE mr.id = maintenance_status_logs.request_id
        AND p.landlord_id = auth.uid()
    )
);

-- Tenants can view logs for their requests
CREATE POLICY "Tenants can view logs for their requests" 
ON public.maintenance_status_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        WHERE mr.id = maintenance_status_logs.request_id
        AND mr.tenant_id = auth.uid()
    )
);

-- Providers can view logs for assigned requests
CREATE POLICY "Providers can view logs for assigned requests" 
ON public.maintenance_status_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.repair_assignments ra
        JOIN public.service_providers sp ON ra.provider_id = sp.id
        WHERE ra.request_id = maintenance_status_logs.request_id
        AND sp.user_id = auth.uid()
    )
);

-- status logging trigger
CREATE OR REPLACE FUNCTION public.log_maintenance_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.maintenance_status_logs (request_id, status, changed_by, notes)
        VALUES (NEW.id, NEW.status, auth.uid(), 'Request created');
    ELSIF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.maintenance_status_logs (request_id, status, previous_status, changed_by, notes)
        VALUES (NEW.id, NEW.status, OLD.status, auth.uid(), 'Status updated');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_maintenance_status_change ON public.maintenance_requests;
CREATE TRIGGER on_maintenance_status_change
    AFTER INSERT OR UPDATE ON public.maintenance_requests
    FOR EACH ROW EXECUTE PROCEDURE public.log_maintenance_status_change();

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
