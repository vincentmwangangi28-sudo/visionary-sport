-- Enable realtime for predictions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;

-- Create sample active contest
INSERT INTO public.contests (name, description, entry_fee, prize_pool, start_date, end_date, status)
VALUES 
  ('Weekend Premier League Challenge', 'Predict all weekend matches and win big!', 50, 5000, NOW(), NOW() + INTERVAL '7 days', 'active'),
  ('Champions League Special', 'Test your knowledge on Europe''s elite competition', 100, 10000, NOW(), NOW() + INTERVAL '14 days', 'active');

-- Create sample predictions for demonstration
INSERT INTO public.predictions (match_id, home_team, away_team, league, match_date, prediction, confidence, reasoning, is_premium)
VALUES
  ('arsenal-chelsea-2025', 'Arsenal', 'Chelsea', 'Premier League', NOW() + INTERVAL '2 days', 'Home Win', 72, 'Arsenal has strong home form with 8 consecutive wins at Emirates Stadium. Chelsea struggling with injuries to key defenders. Historical data shows Arsenal wins 65% of home fixtures against Chelsea in last 5 seasons.', false),
  ('barcelona-real-madrid-2025', 'Barcelona', 'Real Madrid', 'La Liga', NOW() + INTERVAL '3 days', 'Draw', 58, 'El Clasico historically produces tight matches. Both teams in excellent form with similar attacking stats. Recent head-to-head shows 40% draw rate. Weather conditions favor possession-based football.', false),
  ('man-utd-liverpool-2025', 'Manchester United', 'Liverpool', 'Premier League', NOW() + INTERVAL '1 day', 'Away Win', 68, 'Liverpool''s attacking trio in peak form with 15 goals in last 4 matches. Man Utd defensive record poor at home this season. Liverpool has superior expected goals (xG) metrics and won last 3 encounters.', true);