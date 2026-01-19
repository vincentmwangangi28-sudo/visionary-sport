-- Create email digest subscriptions table
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  is_active BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{"predictions": true, "news": true, "alerts": true}'::jsonb,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create SMS subscriptions table
CREATE TABLE IF NOT EXISTS public.sms_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  country_code TEXT DEFAULT '+254',
  is_active BOOLEAN DEFAULT true,
  alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create accuracy reports table
CREATE TABLE IF NOT EXISTS public.accuracy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_percent NUMERIC(5,2) DEFAULT 0,
  by_league JSONB DEFAULT '{}'::jsonb,
  by_sport JSONB DEFAULT '{}'::jsonb,
  by_confidence_range JSONB DEFAULT '{}'::jsonb,
  top_performing_leagues TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create match result verifications table
CREATE TABLE IF NOT EXISTS public.match_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  actual_result TEXT,
  home_score INTEGER,
  away_score INTEGER,
  is_correct BOOLEAN,
  verified_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'api-sports',
  UNIQUE(prediction_id)
);

-- Create prediction cards storage tracking
CREATE TABLE IF NOT EXISTS public.prediction_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accuracy_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_subscriptions
CREATE POLICY "Users can view own email subscription" ON public.email_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own email subscription" ON public.email_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email subscription" ON public.email_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email subscription" ON public.email_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sms_subscriptions
CREATE POLICY "Users can view own sms subscription" ON public.sms_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sms subscription" ON public.sms_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sms subscription" ON public.sms_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sms subscription" ON public.sms_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for accuracy_reports (public read)
CREATE POLICY "Anyone can view accuracy reports" ON public.accuracy_reports
  FOR SELECT USING (true);

-- RLS Policies for match_verifications (public read)
CREATE POLICY "Anyone can view match verifications" ON public.match_verifications
  FOR SELECT USING (true);

-- RLS Policies for prediction_cards
CREATE POLICY "Anyone can view prediction cards" ON public.prediction_cards
  FOR SELECT USING (true);

CREATE POLICY "Users can create own prediction cards" ON public.prediction_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_email_subscriptions_updated_at
  BEFORE UPDATE ON public.email_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sms_subscriptions_updated_at
  BEFORE UPDATE ON public.sms_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.accuracy_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_verifications;