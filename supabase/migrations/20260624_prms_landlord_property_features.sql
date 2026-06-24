-- 1. Add missing columns to public.properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN ('Monthly', 'Yearly')) DEFAULT 'Monthly',
ADD COLUMN IF NOT EXISTS toilets INTEGER,
ADD COLUMN IF NOT EXISTS size INTEGER,
ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Update existing rows to ensure they have default values where appropriate
UPDATE public.properties SET frequency = 'Monthly' WHERE frequency IS NULL;
UPDATE public.properties SET verification_status = 'pending' WHERE verification_status IS NULL;
UPDATE public.properties SET updated_at = now() WHERE updated_at IS NULL;

-- 3. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to properties table
DROP TRIGGER IF EXISTS update_properties_updated_at_trigger ON public.properties;
CREATE TRIGGER update_properties_updated_at_trigger
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_properties_updated_at();

-- 4. Enable Row Level Security and configure policies
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Remove existing policies first to prevent conflicts
DROP POLICY IF EXISTS "landlord can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "landlords can view own properties" ON public.properties;
DROP POLICY IF EXISTS "anyone can view approved properties" ON public.properties;
DROP POLICY IF EXISTS "landlord can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "landlord can update own properties" ON public.properties;
DROP POLICY IF EXISTS "landlord can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "admin can do anything on properties" ON public.properties;

-- Policy A: Anyone can view approved/available listings (DO NOT show deleted/rejected properties)
CREATE POLICY "anyone can view approved properties" ON public.properties
    FOR SELECT
    USING (verification_status = 'approved' AND status = 'available');

-- Policy B: Landlords can view their own properties regardless of approval status
CREATE POLICY "landlords can view own properties" ON public.properties
    FOR SELECT
    USING (auth.uid() = landlord_id);

-- Policy C: Landlords can insert properties for themselves (ensure role is landlord)
CREATE POLICY "landlord can insert own properties" ON public.properties
    FOR INSERT
    WITH CHECK (
        auth.uid() = landlord_id 
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'landlord'
    );

-- Policy D: Landlords can update their own properties
CREATE POLICY "landlord can update own properties" ON public.properties
    FOR UPDATE
    USING (auth.uid() = landlord_id)
    WITH CHECK (auth.uid() = landlord_id);

-- Policy E: Landlords can delete their own properties
CREATE POLICY "landlord can delete own properties" ON public.properties
    FOR DELETE
    USING (auth.uid() = landlord_id);

-- Policy F: Admin can do anything on properties (approve, reject, delete, view, etc.)
CREATE POLICY "admin can do anything on properties" ON public.properties
    FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload config';
