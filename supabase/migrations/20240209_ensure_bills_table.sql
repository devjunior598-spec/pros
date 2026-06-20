-- Ensure tables exist (Idempotent)

-- 1. Properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    monthly_rent NUMERIC,
    status TEXT DEFAULT 'available',
    image_url TEXT,
    images TEXT[],
    landlord_id UUID REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON public.properties FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Enable insert for landlords') THEN
        CREATE POLICY "Enable insert for landlords" ON public.properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Enable update for landlords') THEN
        CREATE POLICY "Enable update for landlords" ON public.properties FOR UPDATE USING (auth.uid() = landlord_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Enable delete for landlords') THEN
        CREATE POLICY "Enable delete for landlords" ON public.properties FOR DELETE USING (auth.uid() = landlord_id);
    END IF;
END $$;

-- 2. Rentals
CREATE TABLE IF NOT EXISTS public.rentals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    property_id UUID REFERENCES public.properties(id) NOT NULL,
    tenant_id UUID REFERENCES auth.users(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active'
);
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'rentals' AND policyname = 'Enable read for related users') THEN
        CREATE POLICY "Enable read for related users" ON public.rentals FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() IN (SELECT landlord_id FROM public.properties WHERE id = property_id));
    END IF;
END $$;


-- 3. Bills
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    rental_id UUID REFERENCES public.rentals(id) NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, overdue
    paid_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'bills' AND policyname = 'Enable read for tenants') THEN
        CREATE POLICY "Enable read for tenants" ON public.bills FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.rentals WHERE rentals.id = bills.rental_id AND rentals.tenant_id = auth.uid())
        );
    END IF;
END $$;

-- 4. Refresh Cache
NOTIFY pgrst, 'reload config';
