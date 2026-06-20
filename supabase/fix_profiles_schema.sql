-- Run this in your Supabase SQL Editor to fix the missing column error

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name text;

-- If you want to enforce it to be not null (as per schema.sql), you might need to handle existing rows first
-- UPDATE profiles SET name = 'Unknown' WHERE name IS NULL;
-- ALTER TABLE profiles ALTER COLUMN name SET NOT NULL;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload config';
