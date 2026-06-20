-- Create Service Jobs Table
CREATE TABLE IF NOT EXISTS public.service_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    landlord_id UUID REFERENCES auth.users(id) NOT NULL,
    provider_id UUID REFERENCES public.service_providers(id) NOT NULL,
    property_id UUID REFERENCES public.properties(id), -- Optional, maybe they just want a quote
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
    scheduled_date DATE
);

-- Enable RLS
ALTER TABLE public.service_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Landlords can view their own jobs
CREATE POLICY "Landlords can view own jobs" 
ON public.service_jobs 
FOR SELECT 
USING (auth.uid() = landlord_id);

-- Landlords can insert jobs
CREATE POLICY "Landlords can insert jobs" 
ON public.service_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = landlord_id);

-- Landlords can update their own jobs (e.g. cancel)
CREATE POLICY "Landlords can update own jobs" 
ON public.service_jobs 
FOR UPDATE 
USING (auth.uid() = landlord_id);

-- Explicit FK to profiles for landlord (if needed for provider view, but currently not building provider dashboard)
-- We'll add it just in case we need to join landlord name later
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_jobs_landlord_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.service_jobs
        ADD CONSTRAINT service_jobs_landlord_id_fkey_profiles
        FOREIGN KEY (landlord_id) REFERENCES public.profiles(id);
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
