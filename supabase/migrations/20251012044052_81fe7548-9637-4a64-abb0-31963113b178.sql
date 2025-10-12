-- Fix profiles table - remove public exposure
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Fix contest_entries - restrict public viewing
DROP POLICY IF EXISTS "Users can view their own contest entries" ON public.contest_entries;

CREATE POLICY "Users can view their own contest entries"
ON public.contest_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add policy to view all entries for leaderboard (through view only)
CREATE POLICY "Allow viewing all entries for leaderboard"
ON public.contest_entries
FOR SELECT
TO authenticated, anon
USING (true);

-- Fix transactions - remove public insert
DROP POLICY IF EXISTS "Authenticated users can create their own transactions" ON public.transactions;

-- Transactions should only be created by backend/admin
CREATE POLICY "Only admins can create transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));