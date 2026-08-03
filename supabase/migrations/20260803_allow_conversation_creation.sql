-- Allow NULL rental_id for general inquiries in conversations table
ALTER TABLE public.conversations ALTER COLUMN rental_id DROP NOT NULL;

-- Enable RLS policy for inserting conversations
DROP POLICY IF EXISTS "Users insert conversations" ON public.conversations;
CREATE POLICY "Users insert conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (
    auth.uid() = tenant_id OR auth.uid() = landlord_id
);

NOTIFY pgrst, 'reload config';
