-- Migration: Admin User Management Utilities

-- 1. Add status column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));
  END IF;
END $$;

-- 2. Create RPC for admins to update user status
CREATE OR REPLACE FUNCTION admin_update_user_status(target_user_id UUID, new_status TEXT)
RETURNS VOID AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Verify caller is an admin
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update user status';
  END IF;

  -- Update profiles status
  UPDATE public.profiles
  SET status = new_status,
      updated_at = NOW()
  WHERE id = target_user_id;

  -- Ideally we would also suspend them in auth.users, but we don't have direct SQL access to auth.users in all setups safely.
  -- A robust implementation would be handled by a secure backend API that uses supabase-admin, but we'll use the profiles status for visibility and RLS protection.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
