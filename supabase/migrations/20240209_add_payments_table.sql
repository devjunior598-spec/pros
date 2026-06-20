-- Create payments table to log all transactions from Paystack
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    bill_id UUID REFERENCES public.bills(id) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, success, failed
    reference TEXT UNIQUE NOT NULL,
    payment_method TEXT,
    channel TEXT,
    currency TEXT DEFAULT 'NGN',
    ip_address TEXT,
    metadata JSONB
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments
-- Tenants can view their own payments
CREATE POLICY "Tenants can view their own payments" ON public.payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bills
        JOIN public.rentals ON rentals.id = bills.rental_id
        WHERE bills.id = payments.bill_id AND rentals.tenant_id = auth.uid()
    )
);

-- Landlords can view payments for their properties
CREATE POLICY "Landlords can view payments for their properties" ON public.payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bills
        JOIN public.rentals ON rentals.id = bills.rental_id
        JOIN public.properties ON properties.id = rentals.property_id
        WHERE bills.id = payments.bill_id AND properties.landlord_id = auth.uid()
    )
);

-- Note: Webhook uses supabaseAdmin (service_role) so it bypasses RLS for inserts.

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
