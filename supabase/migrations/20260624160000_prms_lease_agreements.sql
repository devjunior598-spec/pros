-- Create lease_agreements table
CREATE TABLE IF NOT EXISTS public.lease_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    template_type TEXT CHECK (template_type IN ('residential', 'commercial', 'shortlet', 'custom')) DEFAULT 'residential' NOT NULL,
    title TEXT NOT NULL,
    rent_amount NUMERIC NOT NULL,
    payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'yearly', 'quarterly')) DEFAULT 'monthly' NOT NULL,
    security_deposit NUMERIC NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    house_rules TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    terms_and_conditions TEXT NOT NULL,
    status TEXT CHECK (status IN ('Draft', 'Sent', 'Tenant Signed', 'Landlord Signed', 'Fully Signed', 'Expired', 'Cancelled')) DEFAULT 'Draft' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create lease_signatures table
CREATE TABLE IF NOT EXISTS public.lease_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('landlord', 'tenant')) NOT NULL,
    signer_name TEXT NOT NULL,
    signature_type TEXT CHECK (signature_type IN ('typed', 'drawn')) NOT NULL,
    signature_value TEXT NOT NULL, -- Typed cursive name OR base64 drawn PNG image data
    ip_address TEXT,
    user_agent TEXT,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_signatures ENABLE ROW LEVEL SECURITY;

-- Lease Agreements SELECT Policies
DROP POLICY IF EXISTS "Users can view own leases" ON public.lease_agreements;
CREATE POLICY "Users can view own leases" ON public.lease_agreements
    FOR SELECT USING (auth.uid() = landlord_id OR auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Admins can view all leases" ON public.lease_agreements;
CREATE POLICY "Admins can view all leases" ON public.lease_agreements
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Lease Agreements INSERT Policies
DROP POLICY IF EXISTS "Landlords can insert leases" ON public.lease_agreements;
CREATE POLICY "Landlords can insert leases" ON public.lease_agreements
    FOR INSERT WITH CHECK (auth.uid() = landlord_id);

-- Lease Agreements UPDATE Policies
DROP POLICY IF EXISTS "Parties can update leases" ON public.lease_agreements;
CREATE POLICY "Parties can update leases" ON public.lease_agreements
    FOR UPDATE USING (
        auth.uid() = landlord_id OR 
        auth.uid() = tenant_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Lease Signatures SELECT Policies
DROP POLICY IF EXISTS "Parties can view signatures" ON public.lease_signatures;
CREATE POLICY "Parties can view signatures" ON public.lease_signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.lease_agreements 
            WHERE id = lease_id AND (landlord_id = auth.uid() OR tenant_id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Lease Signatures INSERT Policies
DROP POLICY IF EXISTS "Users can insert own signature" ON public.lease_signatures;
CREATE POLICY "Users can insert own signature" ON public.lease_signatures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.lease_agreements;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.lease_agreements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Reload configuration
NOTIFY pgrst, 'reload config';
