-- Migration: Create maintenance_proofs storage bucket

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance_proofs', 'maintenance_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts if re-run
DROP POLICY IF EXISTS "Providers can upload proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own proofs" ON storage.objects;

-- 3. Create policies for the maintenance_proofs bucket
-- Note: We assume the bucket is public so landlords can view the images without signed URLs

CREATE POLICY "Providers can upload proofs" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'maintenance_proofs'
);

CREATE POLICY "Anyone can view proofs" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'maintenance_proofs');

CREATE POLICY "Users can delete their own proofs" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'maintenance_proofs' 
    AND auth.uid() = owner
);
