-- Add sport type to predictions for multi-sport support
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'football';
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS is_upset_alert BOOLEAN DEFAULT false;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS odds_value NUMERIC;

-- Add sport to upcoming matches cache
ALTER TABLE upcoming_matches_cache ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'football';

-- Create user badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Enable RLS on user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view all badges" ON public.user_badges
  FOR SELECT USING (true);

-- Create smart slips table for accumulator builder
CREATE TABLE IF NOT EXISTS public.smart_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  predictions JSONB NOT NULL DEFAULT '[]',
  total_odds NUMERIC,
  combined_confidence INTEGER,
  stake_suggestion NUMERIC,
  potential_return NUMERIC,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on smart_slips
ALTER TABLE public.smart_slips ENABLE ROW LEVEL SECURITY;

-- RLS policies for smart_slips
CREATE POLICY "Anyone can view public slips" ON public.smart_slips
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create slips" ON public.smart_slips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their slips" ON public.smart_slips
  FOR DELETE USING (auth.uid() = user_id);

-- Create match FAQs table for SEO
CREATE TABLE IF NOT EXISTS public.match_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on match_faqs
ALTER TABLE public.match_faqs ENABLE ROW LEVEL SECURITY;

-- Public read access for FAQs
CREATE POLICY "Public read access for match FAQs" ON public.match_faqs
  FOR SELECT USING (true);

-- Create user streaks table for gamification
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_prediction_date DATE,
  total_correct INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_streaks
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_streaks
CREATE POLICY "Users can view their own streaks" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public leaderboard view" ON public.user_streaks
  FOR SELECT USING (true);

CREATE POLICY "Users can update their streaks" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create SEO metadata table
CREATE TABLE IF NOT EXISTS public.seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  og_image TEXT,
  structured_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on seo_metadata
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

-- Public read access for SEO metadata
CREATE POLICY "Public read access for SEO metadata" ON public.seo_metadata
  FOR SELECT USING (true);

-- Add realtime for smart_slips
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_slips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;