-- Migration to fix the signup trigger and profiles table constraints

-- 1. Ensure the first_name and last_name columns exist on profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;

-- 2. Make the 'name' column nullable so it doesn't fail if name is not provided
ALTER TABLE public.profiles ALTER COLUMN name DROP NOT NULL;

-- 3. Drop the old check constraint on role to allow 'service_provider' and 'admin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 4. Re-create the role check constraint to include 'service_provider' and 'admin'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('tenant', 'landlord', 'service_provider', 'admin'));

-- 5. Fix the handle_new_user trigger function to insert all required columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    meta_data jsonb;
    first_name_val text;
    last_name_val text;
    full_name_val text;
    role_val text;
BEGIN
    meta_data := new.raw_user_meta_data::jsonb;
    
    first_name_val := coalesce(meta_data->>'first_name', '');
    last_name_val := coalesce(meta_data->>'last_name', '');
    
    full_name_val := coalesce(
        meta_data->>'full_name',
        nullif(trim(first_name_val || ' ' || last_name_val), ''),
        meta_data->>'name',
        'User'
    );
    
    role_val := coalesce(meta_data->>'role', 'tenant');

    INSERT INTO public.profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        name, 
        full_name
    )
    VALUES (
        new.id,
        new.email,
        first_name_val,
        last_name_val,
        role_val,
        full_name_val,
        full_name_val
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        full_name = EXCLUDED.full_name;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Re-create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
