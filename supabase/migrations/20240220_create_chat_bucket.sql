-- Create the chat-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to chat files
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-files' );

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated Users Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'chat-files' AND auth.role() = 'authenticated' );

-- Policy: Allow users to update their own files (optional, mostly for metadata)
CREATE POLICY "Users Update Own Files"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'chat-files' AND owner = auth.uid() );

-- Policy: Allow users to delete their own files
CREATE POLICY "Users Delete Own Files"
ON storage.objects FOR DELETE
USING ( bucket_id = 'chat-files' AND owner = auth.uid() );
