
-- Reload the schema cache (standard Supabase/PostgREST fix)
NOTIFY pgrst, 'reload config';

-- Create 'properties' table if it doesn't exist
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

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Enable read access for all users" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Enable insert for landlords" ON public.properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Enable update for landlords" ON public.properties FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Enable delete for landlords" ON public.properties FOR DELETE USING (auth.uid() = landlord_id);

-- Create 'rentals' table
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
CREATE POLICY "Enable read for related users" ON public.rentals FOR SELECT USING (auth.uid() = tenant_id); -- AND landlord check via join ideally, kept simple for now

-- Create 'bills' table
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
CREATE POLICY "Enable read for tenants" ON public.bills FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rentals WHERE rentals.id = bills.rental_id AND rentals.tenant_id = auth.uid())
);
