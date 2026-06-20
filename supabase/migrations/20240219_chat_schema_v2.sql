-- Upgrade Chat System
-- Date: 2024-02-20

-- 1. Enhance Messages Table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('text', 'image', 'file', 'system')) DEFAULT 'text',
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 2. Create Calls Table
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    caller_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT CHECK (status IN ('initiated', 'ringing', 'ongoing', 'completed', 'missed', 'declined')) DEFAULT 'initiated',
    type TEXT CHECK (type IN ('audio', 'video')) DEFAULT 'audio',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER) STORED
);

-- 3. Enable RLS on Calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Calls
CREATE POLICY "Users can view their own calls"
ON public.calls FOR SELECT
USING (
    auth.uid() = caller_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can insert calls"
ON public.calls FOR INSERT
WITH CHECK (
    auth.uid() = caller_id AND 
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.landlord_id = auth.uid() OR c.tenant_id = auth.uid())
    )
);

CREATE POLICY "Users can update their own calls"
ON public.calls FOR UPDATE
USING (
    auth.uid() = caller_id OR auth.uid() = receiver_id
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_calls_conversation_id ON public.calls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON public.calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_receiver_id ON public.calls(receiver_id);

NOTIFY pgrst, 'reload config';
