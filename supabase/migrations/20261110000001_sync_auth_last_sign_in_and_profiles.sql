-- ============================================================================
-- Sync Supabase Auth `last_sign_in_at` with `public.profiles.updated_at`
-- and backfill `last_sign_in_at` for confirmed accounts created during client standby
-- ============================================================================

-- 1. Backfill `last_sign_in_at` on `auth.users` for any recently created accounts
-- where `email_confirmed_at` is set (or autoconfirm is enabled) but `last_sign_in_at` was NULL
UPDATE auth.users
SET last_sign_in_at = COALESCE(last_sign_in_at, email_confirmed_at, created_at)
WHERE last_sign_in_at IS NULL
  AND (email_confirmed_at IS NOT NULL OR created_at IS NOT NULL);

-- 2. Ensure `public.handle_new_user()` sets `updated_at` and syncs metadata cleanly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, coins, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, 'User'), '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    100,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.last_sign_in_at, NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = CASE
      WHEN profiles.full_name IS NULL OR profiles.full_name = '' OR profiles.full_name = 'User'
      THEN COALESCE(EXCLUDED.full_name, profiles.full_name)
      ELSE profiles.full_name
    END,
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = COALESCE(NEW.last_sign_in_at, now());

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Trigger function to automatically sync `auth.users.last_sign_in_at` -> `public.profiles.updated_at`
CREATE OR REPLACE FUNCTION public.handle_user_sign_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at AND NEW.last_sign_in_at IS NOT NULL THEN
    UPDATE public.profiles
    SET updated_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_sign_in();
