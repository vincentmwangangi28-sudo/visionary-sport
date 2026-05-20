-- Ensure avatar_url column exists (may already exist from initial migration)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update handle_new_user to capture Google avatar + name from OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, coins)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'User'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    100
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Only fill in blanks — don't overwrite user-edited fields
    full_name = CASE
      WHEN profiles.full_name IS NULL OR profiles.full_name = 'User'
      THEN COALESCE(EXCLUDED.full_name, profiles.full_name)
      ELSE profiles.full_name
    END,
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);

  -- Assign default 'user' role (ignore if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
