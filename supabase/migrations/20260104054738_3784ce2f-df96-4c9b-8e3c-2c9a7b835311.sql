-- Create table to cache upcoming matches for fast loading
CREATE TABLE public.upcoming_matches_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id text NOT NULL UNIQUE,
  home_team text NOT NULL,
  away_team text NOT NULL,
  league text NOT NULL,
  match_date timestamp with time zone NOT NULL,
  match_time text NOT NULL,
  prediction text,
  confidence integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upcoming_matches_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached matches (public data)
CREATE POLICY "Anyone can view cached matches"
ON public.upcoming_matches_cache
FOR SELECT
USING (true);

-- Only service role can manage cached matches
CREATE POLICY "Service role can manage cached matches"
ON public.upcoming_matches_cache
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for faster queries
CREATE INDEX idx_upcoming_matches_date ON public.upcoming_matches_cache(match_date);

-- Trigger to update updated_at
CREATE TRIGGER update_upcoming_matches_cache_updated_at
BEFORE UPDATE ON public.upcoming_matches_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();