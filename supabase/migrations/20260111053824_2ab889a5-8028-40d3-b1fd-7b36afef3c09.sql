
-- Create table for live match chat messages
CREATE TABLE public.match_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for match chat
CREATE POLICY "Anyone can read chat messages" ON public.match_chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" ON public.match_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.match_chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Create table for push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for push subscriptions
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Create table for expert analysis
CREATE TABLE public.expert_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  form_analysis TEXT,
  head_to_head JSONB,
  injury_report JSONB,
  key_stats JSONB,
  betting_tips TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expert_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view expert analysis" ON public.expert_analysis
  FOR SELECT USING (true);

-- Enable realtime for match chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_chat_messages;
