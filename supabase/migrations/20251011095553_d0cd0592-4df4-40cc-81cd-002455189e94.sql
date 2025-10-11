-- Fix security definer view by making it SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_view;

CREATE OR REPLACE VIEW public.leaderboard_view
WITH (security_invoker = true) AS
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