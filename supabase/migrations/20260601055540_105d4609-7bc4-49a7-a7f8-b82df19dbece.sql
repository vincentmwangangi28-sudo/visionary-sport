
-- 1) Remove sensitive tables from realtime publication (ignore if not member)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','transactions','smart_slips','user_roles','contest_entries',
    'spin_wheel_entries','user_badges','predictions_unlocked',
    'sms_subscriptions','email_subscriptions','whatsapp_subscriptions'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- 2) smart_slips.user_id NOT NULL
DELETE FROM public.smart_slips WHERE user_id IS NULL;
ALTER TABLE public.smart_slips ALTER COLUMN user_id SET NOT NULL;

-- 3) sms_subscriptions update policy: add WITH CHECK
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='sms_subscriptions' AND cmd='UPDATE'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.sms_subscriptions', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Users can update own sms subscription"
ON public.sms_subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4) user_roles: explicit deny for non-admin write operations
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='user_roles'
      AND cmd IN ('INSERT','UPDATE','DELETE')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_roles', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) Private 'users' storage bucket: owner-only access
DROP POLICY IF EXISTS "Users can read own files in users bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files in users bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in users bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in users bucket" ON storage.objects;

CREATE POLICY "Users can read own files in users bucket"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own files in users bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files in users bucket"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files in users bucket"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]);
