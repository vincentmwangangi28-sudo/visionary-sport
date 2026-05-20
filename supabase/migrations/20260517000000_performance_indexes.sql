CREATE INDEX IF NOT EXISTS idx_predictions_match_date ON public.predictions (match_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_is_premium ON public.predictions (is_premium);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_predictions_user_id ON public.user_predictions (user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_history_user_id ON public.predictions_history (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
