-- Enable RLS on edge_function_stats table (admin only)
ALTER TABLE public.edge_function_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view edge_function_stats" 
ON public.edge_function_stats FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on query_performance_log table (admin only)
ALTER TABLE public.query_performance_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view query_performance_log" 
ON public.query_performance_log FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on games_news table (public read)
ALTER TABLE public.games_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read games_news" 
ON public.games_news FOR SELECT USING (true);
CREATE POLICY "Only admins can manage games_news" 
ON public.games_news FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on games_news_archive table (admin only)
ALTER TABLE public.games_news_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can access games_news_archive" 
ON public.games_news_archive FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Drop security definer views and recreate with security invoker
DROP VIEW IF EXISTS public.games_news_recent;
CREATE VIEW public.games_news_recent 
WITH (security_invoker=on) AS
SELECT id, created_at, category, title
FROM public.games_news
ORDER BY created_at DESC
LIMIT 10;

DROP VIEW IF EXISTS public.games_news_featured;
CREATE VIEW public.games_news_featured 
WITH (security_invoker=on) AS
SELECT id, created_at, content, category, author, title
FROM public.games_news
WHERE category IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

DROP VIEW IF EXISTS public.games_news_categories;
CREATE VIEW public.games_news_categories 
WITH (security_invoker=on) AS
SELECT DISTINCT category
FROM public.games_news
WHERE category IS NOT NULL;

DROP VIEW IF EXISTS public.dns_summary;
CREATE VIEW public.dns_summary 
WITH (security_invoker=on) AS
SELECT 
  name as subdomain,
  type as record_type,
  value as target,
  ttl,
  comment as notes
FROM public.dns_records;

-- Fix leaderboard_view to use security invoker
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view 
WITH (security_invoker=on) AS
SELECT 
  us.user_id,
  us.total_correct as score,
  ROW_NUMBER() OVER (ORDER BY us.total_correct DESC) as rank,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN p.full_name
    ELSE 
      CASE 
        WHEN p.full_name IS NOT NULL AND LENGTH(p.full_name) > 0 
        THEN CONCAT(LEFT(p.full_name, 1), '***', RIGHT(p.full_name, 1))
        ELSE 'Anonymous'
      END
  END as full_name
FROM public.user_streaks us
LEFT JOIN public.profiles p ON us.user_id = p.id
ORDER BY us.total_correct DESC;