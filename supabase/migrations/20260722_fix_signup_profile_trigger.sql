-- Keep Auth signups and public profiles in sync.
-- The live trigger writes full_name, so the column must exist before the trigger runs.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first_name_value text := coalesce(metadata->>'first_name', '');
  last_name_value text := coalesce(metadata->>'last_name', '');
  full_name_value text;
  role_value text;
BEGIN
  full_name_value := coalesce(
    nullif(trim(metadata->>'full_name'), ''),
    nullif(trim(first_name_value || ' ' || last_name_value), ''),
    nullif(trim(metadata->>'name'), ''),
    'User'
  );

  role_value := CASE metadata->>'role'
    WHEN 'tenant' THEN 'tenant'
    WHEN 'landlord' THEN 'landlord'
    WHEN 'service_provider' THEN 'service_provider'
    WHEN 'admin' THEN 'admin'
    ELSE 'tenant'
  END;

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
    first_name_value,
    last_name_value,
    role_value,
    full_name_value,
    full_name_value
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    role = excluded.role,
    name = excluded.name,
    full_name = excluded.full_name;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

NOTIFY pgrst, 'reload schema';
