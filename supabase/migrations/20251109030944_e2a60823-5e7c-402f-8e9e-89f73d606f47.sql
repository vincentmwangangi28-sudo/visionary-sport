-- Create predictions_history table to track all predictions
CREATE TABLE IF NOT EXISTS public.predictions_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  match_id TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  competition TEXT,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  prediction TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  actual_result TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.predictions_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own prediction history" 
ON public.predictions_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prediction history" 
ON public.predictions_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prediction history" 
ON public.predictions_history 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_predictions_history_user_id ON public.predictions_history(user_id);
CREATE INDEX idx_predictions_history_match_date ON public.predictions_history(match_date DESC);