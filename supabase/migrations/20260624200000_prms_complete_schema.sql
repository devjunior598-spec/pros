-- ============================================================
-- PRMS Complete Schema — Production Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add ALL missing columns to public.properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kitchen INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parking INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS furnished BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS square_meters NUMERIC,
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_date DATE,
  ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS local_government TEXT,
  ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'draft'
    CHECK (publish_status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'apartment';

-- Backfill publish_status for existing published properties
UPDATE public.properties
SET publish_status = CASE
  WHEN status = 'available' THEN 'published'
  ELSE 'draft'
END
WHERE publish_status IS NULL;

-- 2. Add missing profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill full_name from name if missing
UPDATE public.profiles
SET full_name = name
WHERE full_name IS NULL AND name IS NOT NULL;

-- 3. Create saved_properties table (tenants bookmark properties)
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, property_id)
);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can manage own saved properties" ON public.saved_properties;
CREATE POLICY "Tenants can manage own saved properties" ON public.saved_properties
  FOR ALL USING (auth.uid() = tenant_id);

-- 4. Create property_reports table
CREATE TABLE IF NOT EXISTS public.property_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT CHECK (reason IN ('Scam', 'Incorrect Information', 'Inappropriate Content', 'Already Rented', 'Other')) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(property_id, reporter_id)
);

ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can report properties" ON public.property_reports;
CREATE POLICY "Authenticated users can report properties" ON public.property_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can manage reports" ON public.property_reports;
CREATE POLICY "Admins can manage reports" ON public.property_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Add admin to profiles role check
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('tenant', 'landlord', 'service_provider', 'admin'));

-- 6. Create increment_views function for property views
CREATE OR REPLACE FUNCTION public.increment_property_views(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.properties
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add message attachments support
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'file', 'video')),
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system'));

-- 8. Add typing_at and last_seen to conversations for presence
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 9. Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspection_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_publish_status ON public.properties(publish_status);
CREATE INDEX IF NOT EXISTS idx_properties_state ON public.properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON public.properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_views ON public.properties(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_saved_properties_tenant ON public.saved_properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inspection_bookings_landlord ON public.inspection_bookings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_inspection_bookings_tenant ON public.inspection_bookings(tenant_id);

-- 11. Refresh schema cache
NOTIFY pgrst, 'reload config';
