-- ============================================================
-- PRMS Full System Expansion — SQL Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Property Reviews Table (tenants rate properties)
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, reviewer_id)
);
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read property reviews" ON public.property_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can submit reviews" ON public.property_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON public.property_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = reviewer_id);

-- 2. Add virtual_tour_url and is_approved to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- 3. Add property_type column to properties (if missing)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'apartment';

-- 4. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload config';
