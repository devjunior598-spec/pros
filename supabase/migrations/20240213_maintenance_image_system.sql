-- Migration: Maintenance Request Image System
-- Date: 2024-02-13

-- 1. Update maintenance_requests table to include category
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);

-- Update existing records if property_id is missing (link via rentals)
UPDATE public.maintenance_requests mr
SET property_id = (SELECT property_id FROM public.rentals r WHERE r.id = mr.rental_id)
WHERE mr.property_id IS NULL;

-- 2. Create request_images table
CREATE TABLE IF NOT EXISTS public.request_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on request_images
ALTER TABLE public.request_images ENABLE ROW LEVEL SECURITY;

-- Policies for request_images
-- Tenants can view images for their own requests
CREATE POLICY "Tenants can view own request images" 
ON public.request_images 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        WHERE mr.id = request_images.request_id
        AND mr.tenant_id = auth.uid()
    )
);

-- Tenants can insert images for their own requests
CREATE POLICY "Tenants can insert own request images" 
ON public.request_images 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        WHERE mr.id = request_images.request_id
        AND mr.tenant_id = auth.uid()
    )
);

-- Landlords can view images for requests on their properties
CREATE POLICY "Landlords can view request images for their properties" 
ON public.request_images 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        JOIN public.properties p ON mr.property_id = p.id
        WHERE mr.id = request_images.request_id
        AND p.landlord_id = auth.uid()
    )
);

-- 4. Create storage bucket for maintenance images
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance_images', 'maintenance_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Public read access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'maintenance_images' );

-- Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated users can upload maintenance images" ON storage.objects;
CREATE POLICY "Authenticated users can upload maintenance images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'maintenance_images' );

-- Users can delete their own uploads
DROP POLICY IF EXISTS "Users can delete own maintenance images" ON storage.objects;
CREATE POLICY "Users can delete own maintenance images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'maintenance_images' AND auth.uid() = owner );

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
