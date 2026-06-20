-- Drop the problematic policy
DROP POLICY IF EXISTS "Only permanent users can post to the news feed" ON public.news_feed;

-- Create a corrected policy that allows all authenticated users to post
CREATE POLICY "Authenticated users can post to the news feed"
ON public.news_feed
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload config';
