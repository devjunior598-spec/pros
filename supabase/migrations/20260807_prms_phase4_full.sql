-- Phase 4 Comprehensive Database Migration: Property Management Company Transformation

-- 1. Maintenance Tickets Table
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID,
    rental_id UUID REFERENCES public.rentals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN (
        'Electrical', 'Plumbing', 'Roof', 'Painting', 'Cleaning', 'Security',
        'Air Conditioning', 'Generator', 'Water Supply', 'Internet', 'Appliances',
        'Furniture', 'Doors', 'Windows', 'Locks', 'Others'
    )) NOT NULL,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium' NOT NULL,
    is_emergency BOOLEAN DEFAULT false NOT NULL,
    images TEXT[] DEFAULT '{}'::TEXT[],
    videos TEXT[] DEFAULT '{}'::TEXT[],
    preferred_visit_date DATE,
    preferred_visit_time TEXT,
    special_instructions TEXT,
    status TEXT CHECK (status IN (
        'Submitted', 'Reviewed', 'Assigned', 'Accepted', 'Technician On The Way',
        'In Progress', 'Waiting Parts', 'Completed', 'Rejected', 'Cancelled'
    )) DEFAULT 'Submitted' NOT NULL,
    assigned_provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    technician_location JSONB DEFAULT '{}'::JSONB,
    completion_proof_images TEXT[] DEFAULT '{}'::TEXT[],
    completion_notes TEXT,
    tenant_signature_url TEXT,
    tenant_confirmed_at TIMESTAMPTZ,
    landlord_confirmed_at TIMESTAMPTZ,
    total_cost NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Service Providers Registry
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    trade_category TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}'::TEXT[],
    years_experience INT DEFAULT 1,
    photo_url TEXT,
    id_document_url TEXT,
    address TEXT,
    phone TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_name TEXT,
    certificates TEXT[] DEFAULT '{}'::TEXT[],
    service_areas TEXT[] DEFAULT '{}'::TEXT[],
    is_available BOOLEAN DEFAULT true NOT NULL,
    verification_status TEXT CHECK (verification_status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending' NOT NULL,
    rating_average NUMERIC DEFAULT 5.0 NOT NULL,
    jobs_completed_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Provider Jobs Dispatch Table
CREATE TABLE IF NOT EXISTS public.provider_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('Assigned', 'Accepted', 'Rejected', 'Travelling', 'Arrived', 'Working', 'Completed', 'Cancelled')) DEFAULT 'Assigned' NOT NULL,
    accepted_at TIMESTAMPTZ,
    travel_started_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    work_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    provider_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Property Managers Assignments
CREATE TABLE IF NOT EXISTS public.property_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('Active', 'Inactive', 'Terminated')) DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Customer Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    channel TEXT CHECK (channel IN ('Phone', 'WhatsApp', 'Live Chat', 'Email', 'Portal')) DEFAULT 'Portal' NOT NULL,
    category TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium' NOT NULL,
    department TEXT CHECK (department IN ('Technical', 'Finance', 'Maintenance', 'Inspection', 'Verification', 'General')) DEFAULT 'General' NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('Open', 'In Progress', 'Waiting Customer', 'Escalated', 'Resolved', 'Closed')) DEFAULT 'Open' NOT NULL,
    resolution_notes TEXT,
    csat_rating INT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Support Messages
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Customer Ratings Ledger
CREATE TABLE IF NOT EXISTS public.customer_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rated_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_type TEXT CHECK (target_type IN ('Technician', 'Property Manager', 'Customer Support', 'Landlord')) NOT NULL,
    target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    entity_id UUID,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Maintenance Invoices
CREATE TABLE IF NOT EXISTS public.maintenance_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quotation_amount NUMERIC NOT NULL,
    parts_cost NUMERIC DEFAULT 0 NOT NULL,
    labor_cost NUMERIC DEFAULT 0 NOT NULL,
    prms_commission NUMERIC DEFAULT 0 NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('Quotation', 'Approved', 'Paid', 'Rejected')) DEFAULT 'Quotation' NOT NULL,
    payment_id UUID,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Operations Inventory Items
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('Asset', 'Material', 'Equipment', 'Vehicle', 'Spare Part')) NOT NULL,
    quantity INT DEFAULT 0 NOT NULL,
    min_threshold INT DEFAULT 5 NOT NULL,
    unit_cost NUMERIC DEFAULT 0 NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. Emergency Alerts
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    emergency_type TEXT CHECK (emergency_type IN ('Fire', 'Flood', 'Gas Leak', 'Electrical Hazard', 'Break-in', 'Medical Emergency')) NOT NULL,
    location_notes TEXT,
    status TEXT CHECK (status IN ('Dispatched', 'Responding', 'Resolved')) DEFAULT 'Dispatched' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS POLICIES
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Maintenance ticket access policy" ON public.maintenance_tickets;
CREATE POLICY "Maintenance ticket access policy" ON public.maintenance_tickets FOR ALL USING (
    auth.uid() = tenant_id OR auth.uid() = landlord_id OR auth.uid() = assigned_provider_id OR auth.uid() = assigned_manager_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support', 'operations'))
);

DROP POLICY IF EXISTS "Service provider profile policy" ON public.service_providers;
CREATE POLICY "Service provider profile policy" ON public.service_providers FOR ALL USING (true);

DROP POLICY IF EXISTS "Provider jobs policy" ON public.provider_jobs;
CREATE POLICY "Provider jobs policy" ON public.provider_jobs FOR ALL USING (
    auth.uid() = provider_id OR auth.uid() = landlord_id OR auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operations'))
);

DROP POLICY IF EXISTS "Support ticket policy" ON public.support_tickets;
CREATE POLICY "Support ticket policy" ON public.support_tickets FOR ALL USING (
    auth.uid() = user_id OR auth.uid() = assigned_agent_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

DROP POLICY IF EXISTS "Support message policy" ON public.support_messages;
CREATE POLICY "Support message policy" ON public.support_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR assigned_agent_id = auth.uid())) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

DROP POLICY IF EXISTS "Inventory policy" ON public.inventory_items;
CREATE POLICY "Inventory policy" ON public.inventory_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operations', 'manager'))
);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maintenance-proofs', 'maintenance-proofs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('provider-documents', 'provider-documents', false)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
