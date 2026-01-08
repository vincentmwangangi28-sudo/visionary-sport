-- Create tables for enhanced features: news articles, polls, transfer rumors, accuracy tracking

-- News articles table for Content Hub
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT NOT NULL DEFAULT 'news',
  tags TEXT[] DEFAULT '{}',
  featured_image TEXT,
  author TEXT DEFAULT 'PredictPro AI',
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Interactive polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  match_id TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Poll votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Transfer rumors table
CREATE TABLE public.transfer_rumors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  current_club TEXT,
  target_club TEXT,
  transfer_fee TEXT,
  probability INTEGER DEFAULT 50,
  source TEXT,
  headline TEXT NOT NULL,
  details TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Platform accuracy tracking table
CREATE TABLE public.platform_accuracy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_percent DECIMAL(5,2) DEFAULT 0,
  by_league JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_rumors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_accuracy ENABLE ROW LEVEL SECURITY;

-- Public read access for news, polls, transfer rumors, accuracy
CREATE POLICY "Public read access for news articles" ON public.news_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access for polls" ON public.polls FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for poll votes count" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read access for transfer rumors" ON public.transfer_rumors FOR SELECT USING (true);
CREATE POLICY "Public read access for platform accuracy" ON public.platform_accuracy FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_created_at ON public.news_articles(created_at DESC);
CREATE INDEX idx_polls_active ON public.polls(is_active, ends_at);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_transfer_rumors_created_at ON public.transfer_rumors(created_at DESC);
CREATE INDEX idx_platform_accuracy_date ON public.platform_accuracy(date DESC);

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_accuracy;