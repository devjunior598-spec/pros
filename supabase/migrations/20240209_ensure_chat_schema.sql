-- Ensure conversations table exists (idempotent check not fully possible in strict SQL without DO block, but Policies are key)

-- Create tables if they don't exist (if they do, this is skipped)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    rental_id UUID REFERENCES public.rentals(id) NOT NULL,
    landlord_id UUID REFERENCES auth.users(id) NOT NULL,
    tenant_id UUID REFERENCES auth.users(id) NOT NULL,
    UNIQUE(rental_id) -- One conversation per rental to keep it simple
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for Conversations

-- Landlords can view their own conversations
DROP POLICY IF EXISTS "Landlords view conversations" ON public.conversations;
CREATE POLICY "Landlords view conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = landlord_id);

-- Tenants can view their own conversations
DROP POLICY IF EXISTS "Tenants view conversations" ON public.conversations;
CREATE POLICY "Tenants view conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = tenant_id);

-- Policies for Messages

-- Users can view messages in conversations they belong to
DROP POLICY IF EXISTS "Users view messages" ON public.messages;
CREATE POLICY "Users view messages" 
ON public.messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE conversations.id = messages.conversation_id 
        AND (conversations.landlord_id = auth.uid() OR conversations.tenant_id = auth.uid())
    )
);

-- Users can insert messages in conversations they belong to
DROP POLICY IF EXISTS "Users insert messages" ON public.messages;
CREATE POLICY "Users insert messages" 
ON public.messages FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE conversations.id = messages.conversation_id 
        AND (conversations.landlord_id = auth.uid() OR conversations.tenant_id = auth.uid())
    )
    AND auth.uid() = sender_id
);

-- Special Policy: Allow inserting a new conversation? 
-- Usually created automatically when a rental is approved/started.
-- For now we assume conversation exists or is created by system.
-- But let's allow tenants/landlords to Insert if they share a Rental.

NOTIFY pgrst, 'reload config';
