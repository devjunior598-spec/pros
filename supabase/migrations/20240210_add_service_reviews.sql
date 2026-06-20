-- Create Service Reviews Table
CREATE TABLE IF NOT EXISTS public.service_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    job_id UUID REFERENCES public.service_jobs(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES auth.users(id) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    UNIQUE(job_id) -- One review per job
);

-- Enable RLS
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Landlords can insert reviews for their own jobs
CREATE POLICY "Landlords can insert reviews" 
ON public.service_reviews 
FOR INSERT 
WITH CHECK (
    auth.uid() = landlord_id
    AND EXISTS (
        SELECT 1 FROM public.service_jobs 
        WHERE id = job_id 
        AND landlord_id = auth.uid()
        AND status = 'completed'
    )
);

-- Everyone can view reviews (to see provider feedback)
CREATE POLICY "Everyone can view reviews" 
ON public.service_reviews 
FOR SELECT 
USING (true);

-- FK to profiles for landlord name in reviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_reviews_landlord_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.service_reviews
        ADD CONSTRAINT service_reviews_landlord_id_fkey_profiles
        FOREIGN KEY (landlord_id) REFERENCES public.profiles(id);
    END IF;
END $$;


-- Database Trigger to Auto-Update Provider Rating
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.service_providers
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM public.service_reviews 
            WHERE provider_id = NEW.provider_id
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM public.service_reviews 
            WHERE provider_id = NEW.provider_id
        )
    WHERE id = NEW.provider_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_review_created ON public.service_reviews;
CREATE TRIGGER on_review_created
AFTER INSERT OR UPDATE OR DELETE ON public.service_reviews
FOR EACH ROW EXECUTE PROCEDURE public.update_provider_rating();

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
