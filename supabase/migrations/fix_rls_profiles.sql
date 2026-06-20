
-- Enable RLS on profiles table (should already be enabled, but good to ensure)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own profile
CREATE POLICY "Enable insert for users based on user_id" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policy to allow users to view their own profile
CREATE POLICY "Enable select for users based on user_id" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Enable update for users based on user_id" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- (Optional) If you want public profiles, change the SELECT policy to simply: true
