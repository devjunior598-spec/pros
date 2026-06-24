-- 1. Create landlord_availabilities table
CREATE TABLE IF NOT EXISTS public.landlord_availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    start_time TIME DEFAULT '09:00:00',
    end_time TIME DEFAULT '17:00:00',
    slot_duration INTEGER DEFAULT 30, -- minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create inspection_bookings table
CREATE TABLE IF NOT EXISTS public.inspection_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    inspection_time TIME NOT NULL,
    inspection_type TEXT CHECK (inspection_type IN ('Physical Visit', 'Virtual Tour')) NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.landlord_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_bookings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for landlord_availabilities
DROP POLICY IF EXISTS "Anyone can view availability" ON public.landlord_availabilities;
CREATE POLICY "Anyone can view availability" ON public.landlord_availabilities
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Landlords can manage own availability" ON public.landlord_availabilities;
CREATE POLICY "Landlords can manage own availability" ON public.landlord_availabilities
    FOR ALL USING (auth.uid() = landlord_id);

-- 5. RLS Policies for inspection_bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.inspection_bookings;
CREATE POLICY "Users can view own bookings" ON public.inspection_bookings
    FOR SELECT USING (
        auth.uid() = tenant_id OR 
        auth.uid() = landlord_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.inspection_bookings;
CREATE POLICY "Anyone can insert bookings" ON public.inspection_bookings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.inspection_bookings;
CREATE POLICY "Users can update own bookings" ON public.inspection_bookings
    FOR UPDATE USING (
        auth.uid() = tenant_id OR 
        auth.uid() = landlord_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Trigger for updated_at on landlord_availabilities
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.landlord_availabilities;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.landlord_availabilities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Trigger for updated_at on inspection_bookings
DROP TRIGGER IF EXISTS set_updated_at ON public.inspection_bookings;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.inspection_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Refresh postgrest cache
NOTIFY pgrst, 'reload config';
