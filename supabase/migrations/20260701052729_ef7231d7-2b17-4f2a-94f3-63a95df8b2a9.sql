
ALTER TABLE public.prediction_cards ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "Users can update own smart slips" ON public.smart_slips;
CREATE POLICY "Users can update own smart slips"
  ON public.smart_slips FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view all badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public leaderboard view" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can view their own streaks" ON public.user_streaks;
CREATE POLICY "Users can view their own streaks"
  ON public.user_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
