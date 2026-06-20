-- Migration: Add Receipts Table
-- Description: Stores generated receipt records for payments.

CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    receipt_number TEXT UNIQUE NOT NULL,
    payment_id UUID NOT NULL, -- Link to payments table (assuming id exists there)
    tenant_id UUID REFERENCES auth.users(id) NOT NULL,
    property_id UUID REFERENCES public.properties(id), -- Optional direct link
    amount_paid NUMERIC NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'issued',
    file_url TEXT, -- Path to stored PDF in Supabase Storage if applicable
    metadata JSONB
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'receipts' AND policyname = 'Tenants can view own receipts') THEN
        CREATE POLICY "Tenants can view own receipts" ON public.receipts 
        FOR SELECT USING (auth.uid() = tenant_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'receipts' AND policyname = 'Landlords can view receipts for their properties') THEN
        CREATE POLICY "Landlords can view receipts for their properties" ON public.receipts 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.properties
                WHERE properties.id = receipts.property_id AND properties.landlord_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Refresh Cache
NOTIFY pgrst, 'reload config';
