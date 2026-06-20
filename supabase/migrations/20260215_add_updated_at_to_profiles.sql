-- Add updated_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE OR REPLACE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW 
EXECUTE PROCEDURE moddatetime (updated_at);
