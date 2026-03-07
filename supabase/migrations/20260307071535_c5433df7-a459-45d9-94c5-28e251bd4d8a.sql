-- Fix 1: referral_codes - remove public "Anyone can lookup codes" and restrict to authenticated
DROP POLICY IF EXISTS "Anyone can lookup codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can view their own code" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can create their code" ON public.referral_codes;

CREATE POLICY "Authenticated users can lookup codes"
ON public.referral_codes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their code"
ON public.referral_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Fix 2: user_badges - remove public view, restrict to authenticated
DROP POLICY IF EXISTS "Public can view all badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;

CREATE POLICY "Authenticated users can view all badges"
ON public.user_badges FOR SELECT TO authenticated USING (true);

-- Fix 3: referrals - restrict to only show referrals where user is the referrer
DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;

CREATE POLICY "Users can view their referrals"
ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals"
ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referred_id);

-- Fix 4: user_roles - ensure policies use 'authenticated' role, not 'public'
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix 5: profiles - fix UPDATE policy to use 'authenticated' role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);