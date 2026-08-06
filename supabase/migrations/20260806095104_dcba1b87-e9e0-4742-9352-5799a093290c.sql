DROP POLICY IF EXISTS "Anyone can view prediction cards" ON public.prediction_cards;

CREATE POLICY "Users can view own prediction cards"
ON public.prediction_cards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);