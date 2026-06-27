-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "property-images public read" ON storage.objects;
DROP POLICY IF EXISTS "property-images landlord insert" ON storage.objects;
DROP POLICY IF EXISTS "property-images landlord update" ON storage.objects;
DROP POLICY IF EXISTS "property-images landlord delete" ON storage.objects;

-- 3. Create public select policy
CREATE POLICY "property-images public read"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'property-images' );

-- 4. Create landlord upload (insert) policy
CREATE POLICY "property-images landlord insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'landlord'
  );

-- 5. Create landlord update policy
CREATE POLICY "property-images landlord update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND auth.uid() = owner
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'landlord'
  );

-- 6. Create landlord delete policy
CREATE POLICY "property-images landlord delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND auth.uid() = owner
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'landlord'
  );
