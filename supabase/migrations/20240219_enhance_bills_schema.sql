-- Migration: Enhance Bills and Add Late Fees
-- Description: Adds late_fees table, modifies bills for partial payments, and updates policies.

-- 1. Create Late Fees Table
CREATE TABLE IF NOT EXISTS public.late_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'waived', 'paid')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for late_fees
ALTER TABLE public.late_fees ENABLE ROW LEVEL SECURITY;

-- Policies for late_fees
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'late_fees' AND policyname = 'Tenants can view own late fees') THEN
        CREATE POLICY "Tenants can view own late fees" ON public.late_fees FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.bills
                JOIN public.rentals ON rentals.id = bills.rental_id
                WHERE bills.id = late_fees.bill_id AND rentals.tenant_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'late_fees' AND policyname = 'Landlords can view late fees for their properties') THEN
        CREATE POLICY "Landlords can view late fees for their properties" ON public.late_fees FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.bills
                JOIN public.rentals ON rentals.id = bills.rental_id
                JOIN public.properties ON properties.id = rentals.property_id
                WHERE bills.id = late_fees.bill_id AND properties.landlord_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 2. Modify Bills Table
-- Add amount_paid column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'amount_paid') THEN
        ALTER TABLE public.bills ADD COLUMN amount_paid NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Update status check constraint for bills to include new statuses
ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_status_check;
ALTER TABLE public.bills ADD CONSTRAINT bills_status_check 
    CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid', 'processing', 'failed'));

-- 3. Function to handle Partial Payments (optional logic helper)
-- Triggers/functions can be added here if we want auto-updates, but for now we will handle in app logic.

-- 4. Refresh Cache
NOTIFY pgrst, 'reload config';
