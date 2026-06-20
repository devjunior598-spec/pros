-- Enhance bills table to support automated generation and different bill types
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'rent',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing records if any
UPDATE public.bills SET type = 'rent' WHERE type IS NULL;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
