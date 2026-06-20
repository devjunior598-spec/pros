-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (clean slate for this table)
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create comprehensive policies

-- 1. VIEW: Users can see their own profile. 
-- AND Landlords can see their tenants (referenced in rentals).
-- AND Tenants can see their landlord (referenced in rentals).
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Landlords can view tenants"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.rentals
        WHERE rentals.tenant_id = profiles.id
        AND rentals.landlord_id = auth.uid()
    )
);

CREATE POLICY "Tenants can view landlords"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.rentals
        WHERE rentals.landlord_id = profiles.id
        AND rentals.tenant_id = auth.uid()
    )
);

-- 2. UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 3. INSERT: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Note: We might need a public read policy if we have public profiles, but for now strict is better.
-- If the "fetch user data" error persists, it might be that the user doesn't exist in profiles?
-- But triggered creation should handle that.

NOTIFY pgrst, 'reload config';
