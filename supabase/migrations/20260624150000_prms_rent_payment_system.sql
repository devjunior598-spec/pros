-- Create rent_payments table
CREATE TABLE IF NOT EXISTS public.rent_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Paystack', 'Flutterwave', 'Bank Transfer Reference', 'Wallet')),
    transaction_reference TEXT UNIQUE NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Overdue', 'Refunded')) DEFAULT 'Pending' NOT NULL,
    due_date DATE,
    payment_date TIMESTAMP WITH TIME ZONE,
    receipt_number TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Tenants can view own rent payments" ON public.rent_payments;
CREATE POLICY "Tenants can view own rent payments" ON public.rent_payments
    FOR SELECT USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Landlords can view own rent payments" ON public.rent_payments;
CREATE POLICY "Landlords can view own rent payments" ON public.rent_payments
    FOR SELECT USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Admins can view all rent payments" ON public.rent_payments;
CREATE POLICY "Admins can view all rent payments" ON public.rent_payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Insert policies
DROP POLICY IF EXISTS "Anyone can insert rent payments" ON public.rent_payments;
CREATE POLICY "Anyone can insert rent payments" ON public.rent_payments
    FOR INSERT WITH CHECK (true);

-- Update policies
DROP POLICY IF EXISTS "Counterparts can update rent payments" ON public.rent_payments;
CREATE POLICY "Counterparts can update rent payments" ON public.rent_payments
    FOR UPDATE USING (
        auth.uid() = tenant_id OR 
        auth.uid() = landlord_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.rent_payments;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.rent_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Reload configuration
NOTIFY pgrst, 'reload config';
