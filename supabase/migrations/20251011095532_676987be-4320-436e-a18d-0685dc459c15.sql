-- Fix critical security issues

-- 1. Fix transactions table RLS - only system can create transactions
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;
CREATE POLICY "Authenticated users can create their own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Fix contest_entries SELECT policy - users can only see their own entries
DROP POLICY IF EXISTS "Users can view contest entries" ON public.contest_entries;
CREATE POLICY "Users can view their own contest entries"
ON public.contest_entries
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create a public leaderboard view for aggregated data
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  ce.user_id,
  ce.score,
  p.full_name,
  ROW_NUMBER() OVER (ORDER BY ce.score DESC) as rank
FROM public.contest_entries ce
LEFT JOIN public.profiles p ON p.id = ce.user_id
ORDER BY ce.score DESC
LIMIT 100;

-- Grant access to the view
GRANT SELECT ON public.leaderboard_view TO authenticated, anon;

-- 4. Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_entries;