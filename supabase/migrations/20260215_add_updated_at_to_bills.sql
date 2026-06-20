-- Add updated_at column to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update updated_at (reusing extension if already created)
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE OR REPLACE TRIGGER handle_bills_updated_at 
BEFORE UPDATE ON public.bills 
FOR EACH ROW 
EXECUTE PROCEDURE moddatetime (updated_at);
