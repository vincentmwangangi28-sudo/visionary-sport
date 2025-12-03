-- Create coin packages table for purchasable coin bundles
CREATE TABLE public.coin_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coins INTEGER NOT NULL,
  price_kes INTEGER NOT NULL,
  bonus_coins INTEGER DEFAULT 0,
  description TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "Anyone can view active coin packages"
ON public.coin_packages FOR SELECT
USING (is_active = true);

-- Only admins can manage packages
CREATE POLICY "Admins can manage coin packages"
ON public.coin_packages FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default coin packages
INSERT INTO public.coin_packages (name, coins, price_kes, bonus_coins, description, is_popular) VALUES
  ('Starter Pack', 50, 50, 0, 'Perfect for trying out premium predictions', false),
  ('Value Pack', 100, 100, 10, 'Best value for regular users', true),
  ('Pro Pack', 250, 250, 50, 'For serious prediction enthusiasts', false),
  ('Elite Pack', 500, 500, 150, 'Maximum coins with huge bonus!', false);

-- Create predictions_unlocked table to track which premium predictions a user has unlocked
CREATE TABLE public.predictions_unlocked (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  coins_spent INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, prediction_id)
);

-- Enable RLS
ALTER TABLE public.predictions_unlocked ENABLE ROW LEVEL SECURITY;

-- Users can view their own unlocked predictions
CREATE POLICY "Users can view their own unlocked predictions"
ON public.predictions_unlocked FOR SELECT
USING (auth.uid() = user_id);

-- Users can unlock predictions
CREATE POLICY "Users can unlock predictions"
ON public.predictions_unlocked FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to unlock a premium prediction atomically
CREATE OR REPLACE FUNCTION public.unlock_prediction(_prediction_id uuid, _coin_cost integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  current_coins integer;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Check if already unlocked
  IF EXISTS (SELECT 1 FROM predictions_unlocked WHERE user_id = _user_id AND prediction_id = _prediction_id) THEN
    RETURN jsonb_build_object('success', true, 'already_unlocked', true);
  END IF;

  -- Lock the profile row and get current coins
  SELECT coins INTO current_coins FROM profiles WHERE id = _user_id FOR UPDATE;

  -- Check balance
  IF current_coins < _coin_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_coins', 'current_coins', current_coins);
  END IF;

  -- Deduct coins
  UPDATE profiles SET coins = coins - _coin_cost WHERE id = _user_id;

  -- Record unlock
  INSERT INTO predictions_unlocked (user_id, prediction_id, coins_spent) VALUES (_user_id, _prediction_id, _coin_cost);

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, status, metadata)
  VALUES (_user_id, 'prediction_unlock', -_coin_cost, 'completed', jsonb_build_object('prediction_id', _prediction_id));

  RETURN jsonb_build_object('success', true, 'new_balance', current_coins - _coin_cost);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'database_error', 'message', SQLERRM);
END;
$$;