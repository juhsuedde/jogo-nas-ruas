-- =============================================================
-- Migration 008: Admin profiles + moderation RLS
-- =============================================================
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nemrqkkuptdikiqqgaho/sql/new
-- =============================================================

-- 1. Create profiles table (one row per auth user)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS: users can read own profile; admins can read all
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- 4. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'is_admin', 'false')::boolean
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5. Sync updated_at on profile change
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profile_updated_at ON profiles;
CREATE TRIGGER profile_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_updated_at();

-- 6. Grant admin to specific user(s) by email
-- Replace 'admin@email.com' with the actual admin email
-- Run AFTER the user has signed up (profile row exists)
-- UPDATE profiles SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@email.com');
-- NOTE: Uncomment and adjust the line above after the admin user has registered.

-- 7. Update venues RLS: admins can SELECT all venues, UPDATE any venue status
DROP POLICY IF EXISTS "admin_can_read_all" ON venues;
CREATE POLICY "admin_can_read_all" ON venues
  FOR SELECT
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_can_update" ON venues;
CREATE POLICY "admin_can_update" ON venues
  FOR UPDATE
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- 8. Ensure existing RLS policies still work for non-admins
-- (public_can_read_approved, owner_can_update, etc. are untouched)
