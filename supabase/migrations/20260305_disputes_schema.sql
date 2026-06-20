-- Create disputes table for platform moderation
CREATE TABLE public.disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    party1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    party2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    related_job_id UUID, -- Optional link to a maintenance request or similar
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all disputes
CREATE POLICY "Admins can view all disputes"
    ON public.disputes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all disputes"
    ON public.disputes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Users can view their own disputes
CREATE POLICY "Users can view their disputes"
    ON public.disputes
    FOR SELECT
    USING (
        auth.uid() = party1_id OR auth.uid() = party2_id
    );

-- Users can insert disputes where they are party1 (the creator)
CREATE POLICY "Users can create disputes"
    ON public.disputes
    FOR INSERT
    WITH CHECK (
        auth.uid() = party1_id
    );

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_disputes_updated
    BEFORE UPDATE ON public.disputes
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();
