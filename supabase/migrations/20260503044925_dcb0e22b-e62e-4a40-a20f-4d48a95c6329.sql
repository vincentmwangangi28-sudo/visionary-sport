
CREATE TABLE IF NOT EXISTS public.prediction_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid NOT NULL,
  match_id text NOT NULL,
  market_key text NOT NULL,
  market_label text NOT NULL,
  market_value text NOT NULL,
  confidence integer NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  is_premium boolean NOT NULL DEFAULT false,
  reasoning text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prediction_id, market_key)
);

CREATE INDEX IF NOT EXISTS idx_prediction_markets_prediction ON public.prediction_markets(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_match ON public.prediction_markets(match_id);

ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view free markets"
ON public.prediction_markets FOR SELECT
USING (
  is_premium = false
  OR has_role(auth.uid(), 'premium'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can insert markets"
ON public.prediction_markets FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update markets"
ON public.prediction_markets FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_prediction_markets_updated_at
BEFORE UPDATE ON public.prediction_markets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
