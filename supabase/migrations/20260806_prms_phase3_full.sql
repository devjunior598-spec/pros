-- Phase 3 Comprehensive Migration: Leases, Rent Payments, Receipts & Financial Management

-- 1. Lease Agreements Table
CREATE TABLE IF NOT EXISTS public.lease_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID,
    application_id UUID REFERENCES public.rentals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    template_type TEXT DEFAULT 'residential' NOT NULL,
    rent_amount NUMERIC NOT NULL,
    payment_frequency TEXT DEFAULT 'monthly' NOT NULL,
    security_deposit NUMERIC DEFAULT 0 NOT NULL,
    service_charge NUMERIC DEFAULT 0 NOT NULL,
    other_charges NUMERIC DEFAULT 0 NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    due_day INT DEFAULT 1 NOT NULL,
    grace_period_days INT DEFAULT 5 NOT NULL,
    late_fee_type TEXT DEFAULT 'fixed' NOT NULL,
    late_fee_amount NUMERIC DEFAULT 0 NOT NULL,
    renewal_terms TEXT,
    notice_period_days INT DEFAULT 30 NOT NULL,
    property_rules TEXT,
    maintenance_terms TEXT,
    utility_terms TEXT,
    guest_policy TEXT,
    pet_policy TEXT,
    termination_terms TEXT,
    custom_terms TEXT,
    status TEXT CHECK (status IN ('Draft', 'Sent', 'Viewed', 'Tenant Signed', 'Landlord Signed', 'Fully Signed', 'Active', 'Expiring Soon', 'Expired', 'Renewal Pending', 'Renewed', 'Terminated', 'Cancelled')) DEFAULT 'Draft' NOT NULL,
    pdf_path TEXT,
    tenant_signed_at TIMESTAMPTZ,
    landlord_signed_at TIMESTAMPTZ,
    fully_signed_at TIMESTAMPTZ,
    terminated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ensure all columns exist on lease_agreements if table was created previously
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS application_id UUID;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS service_charge NUMERIC DEFAULT 0;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS other_charges NUMERIC DEFAULT 0;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS due_day INT DEFAULT 1;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS grace_period_days INT DEFAULT 5;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS late_fee_type TEXT DEFAULT 'fixed';
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC DEFAULT 0;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS renewal_terms TEXT;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS notice_period_days INT DEFAULT 30;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS property_rules TEXT;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS maintenance_terms TEXT;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS utility_terms TEXT;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS guest_policy TEXT;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS pet_policy TEXT;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS termination_terms TEXT;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS custom_terms TEXT;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS pdf_path TEXT;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS tenant_signed_at TIMESTAMPTZ;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS landlord_signed_at TIMESTAMPTZ;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS fully_signed_at TIMESTAMPTZ;
ALTER TABLE public.lease_agreements ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;

-- 2. Lease Signatures Table
CREATE TABLE IF NOT EXISTS public.lease_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('landlord', 'tenant', 'manager', 'admin')) NOT NULL,
    signer_name TEXT NOT NULL,
    signature_type TEXT CHECK (signature_type IN ('typed', 'drawn', 'uploaded')) NOT NULL,
    signature_data TEXT NOT NULL,
    signed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Payment Schedules Table
CREATE TABLE IF NOT EXISTS public.payment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE SET NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID,
    payment_type TEXT CHECK (payment_type IN ('rent', 'security_deposit', 'service_charge', 'utility_charge', 'maintenance_charge', 'inspection_fee', 'late_fee', 'custom_invoice')) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    status TEXT CHECK (status IN ('Upcoming', 'Due', 'Partially Paid', 'Paid', 'Overdue', 'Waived', 'Cancelled')) DEFAULT 'Upcoming' NOT NULL,
    paid_amount NUMERIC DEFAULT 0 NOT NULL,
    outstanding_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_schedule_id UUID REFERENCES public.payment_schedules(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE SET NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'NGN' NOT NULL,
    payment_type TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Paystack' NOT NULL,
    provider TEXT DEFAULT 'Paystack' NOT NULL,
    transaction_reference TEXT UNIQUE NOT NULL,
    provider_reference TEXT,
    payment_status TEXT CHECK (payment_status IN ('Initiated', 'Pending', 'Successful', 'Failed', 'Reversed', 'Refunded', 'Partially Refunded', 'Disputed')) DEFAULT 'Initiated' NOT NULL,
    payment_date TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ensure all columns exist on payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_schedule_id UUID REFERENCES public.payment_schedules(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'rent';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'Paystack';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_reference TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Initiated';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- 5. Payment Webhook Events Table (Idempotency)
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT DEFAULT 'Paystack' NOT NULL,
    event_type TEXT NOT NULL,
    event_reference TEXT UNIQUE NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false NOT NULL,
    processing_error TEXT,
    received_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    processed_at TIMESTAMPTZ
);

-- 6. Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
    receipt_number TEXT UNIQUE NOT NULL,
    pdf_path TEXT,
    issued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    emailed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID,
    payment_type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    notes TEXT,
    pdf_path TEXT,
    status TEXT CHECK (status IN ('Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled')) DEFAULT 'Draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Reminder Logs Table
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_schedule_id UUID REFERENCES public.payment_schedules(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reminder_type TEXT NOT NULL,
    channel TEXT DEFAULT 'in_app' NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Security Deposits Table
CREATE TABLE IF NOT EXISTS public.security_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('Due', 'Paid', 'Held', 'Partially Refunded', 'Fully Refunded', 'Used for Damages', 'Disputed')) DEFAULT 'Due' NOT NULL,
    refund_amount NUMERIC DEFAULT 0 NOT NULL,
    deduction_amount NUMERIC DEFAULT 0 NOT NULL,
    deduction_reason TEXT,
    evidence_urls TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. Refunds Table
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider_reference TEXT,
    status TEXT CHECK (status IN ('Requested', 'Under Review', 'Approved', 'Processing', 'Completed', 'Rejected', 'Failed')) DEFAULT 'Requested' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. Payment Disputes Table
CREATE TABLE IF NOT EXISTS public.payment_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    opened_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT[] DEFAULT '{}'::TEXT[],
    status TEXT CHECK (status IN ('Open', 'Investigating', 'Awaiting Information', 'Resolved', 'Rejected', 'Escalated')) DEFAULT 'Open' NOT NULL,
    assigned_staff UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- 12. Platform Fees Table
CREATE TABLE IF NOT EXISTS public.platform_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
    fee_type TEXT NOT NULL,
    fee_amount NUMERIC NOT NULL,
    percentage NUMERIC DEFAULT 0 NOT NULL,
    recipient TEXT DEFAULT 'PRMS Platform' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 13. Landlord Settlements Table
CREATE TABLE IF NOT EXISTS public.landlord_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    gross_amount NUMERIC NOT NULL,
    processor_fee NUMERIC DEFAULT 0 NOT NULL,
    prms_fee NUMERIC DEFAULT 0 NOT NULL,
    refunds_deducted NUMERIC DEFAULT 0 NOT NULL,
    net_amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('Pending', 'Processing', 'Settled', 'Failed', 'Reversed', 'Held')) DEFAULT 'Pending' NOT NULL,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 14. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    previous_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR LEASE AGREEMENTS
DROP POLICY IF EXISTS "Lease access policy" ON public.lease_agreements;
CREATE POLICY "Lease access policy" ON public.lease_agreements FOR ALL USING (
    auth.uid() = landlord_id OR auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS POLICIES FOR LEASE SIGNATURES
DROP POLICY IF EXISTS "Signature access policy" ON public.lease_signatures;
CREATE POLICY "Signature access policy" ON public.lease_signatures FOR ALL USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.lease_agreements WHERE id = lease_id AND (landlord_id = auth.uid() OR tenant_id = auth.uid())) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS POLICIES FOR PAYMENT SCHEDULES
DROP POLICY IF EXISTS "Payment schedule access policy" ON public.payment_schedules;
CREATE POLICY "Payment schedule access policy" ON public.payment_schedules FOR ALL USING (
    auth.uid() = landlord_id OR auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS POLICIES FOR PAYMENTS
DROP POLICY IF EXISTS "Payment access policy" ON public.payments;
CREATE POLICY "Payment access policy" ON public.payments FOR ALL USING (
    auth.uid() = landlord_id OR auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS POLICIES FOR RECEIPTS
DROP POLICY IF EXISTS "Receipt access policy" ON public.receipts;
CREATE POLICY "Receipt access policy" ON public.receipts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.payments WHERE id = payment_id AND (landlord_id = auth.uid() OR tenant_id = auth.uid())) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS POLICIES FOR INVOICES
DROP POLICY IF EXISTS "Invoice access policy" ON public.invoices;
CREATE POLICY "Invoice access policy" ON public.invoices FOR ALL USING (
    auth.uid() = landlord_id OR auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS POLICIES FOR SECURITY DEPOSITS
DROP POLICY IF EXISTS "Security deposit access policy" ON public.security_deposits;
CREATE POLICY "Security deposit access policy" ON public.security_deposits FOR ALL USING (
    auth.uid() = landlord_id OR auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS POLICIES FOR REFUNDS
DROP POLICY IF EXISTS "Refund access policy" ON public.refunds;
CREATE POLICY "Refund access policy" ON public.refunds FOR ALL USING (
    auth.uid() = landlord_id OR auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS POLICIES FOR DISPUTES
DROP POLICY IF EXISTS "Dispute access policy" ON public.payment_disputes;
CREATE POLICY "Dispute access policy" ON public.payment_disputes FOR ALL USING (
    auth.uid() = opened_by OR EXISTS (SELECT 1 FROM public.payments WHERE id = payment_id AND (landlord_id = auth.uid() OR tenant_id = auth.uid())) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS POLICIES FOR LANDLORD SETTLEMENTS
DROP POLICY IF EXISTS "Settlement access policy" ON public.landlord_settlements;
CREATE POLICY "Settlement access policy" ON public.landlord_settlements FOR ALL USING (
    auth.uid() = landlord_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lease-documents', 'lease-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
