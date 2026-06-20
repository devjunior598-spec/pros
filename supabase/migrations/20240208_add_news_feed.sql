-- Create the news_feed table
CREATE TABLE IF NOT EXISTS public.news_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only permanent users can post to the news feed
CREATE POLICY "Only permanent users can post to the news feed"
ON public.news_feed
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK ((select (auth.jwt()->>'is_anonymous')::boolean) is false );

-- Policy 2: Anonymous and permanent users can view the news feed
CREATE POLICY "Anonymous and permanent users can view the news feed"
ON public.news_feed
FOR SELECT
TO authenticated
USING ( true );

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload config';
