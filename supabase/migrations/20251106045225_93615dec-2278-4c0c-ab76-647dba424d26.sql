-- Fix transaction RLS policies
DROP POLICY IF EXISTS "Only admins can create transactions" ON transactions;

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can modify transactions" ON transactions
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete transactions" ON transactions
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create atomic coin deduction function for contest entries
CREATE OR REPLACE FUNCTION public.enter_contest_atomic(
  _contest_id uuid,
  _entry_fee integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  current_coins integer;
BEGIN
  -- Get authenticated user
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized'
    );
  END IF;

  -- Lock the profile row and get current coins
  SELECT coins INTO current_coins
  FROM profiles
  WHERE id = _user_id
  FOR UPDATE;

  -- Check balance
  IF current_coins < _entry_fee THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_coins',
      'current_coins', current_coins
    );
  END IF;

  -- Check if already entered
  IF EXISTS (
    SELECT 1 FROM contest_entries 
    WHERE user_id = _user_id AND contest_id = _contest_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_entered'
    );
  END IF;

  -- Atomic coin deduction
  UPDATE profiles
  SET coins = coins - _entry_fee
  WHERE id = _user_id;

  -- Create contest entry
  INSERT INTO contest_entries (user_id, contest_id, score)
  VALUES (_user_id, _contest_id, 0);

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, status, metadata)
  VALUES (
    _user_id, 
    'contest_entry', 
    -_entry_fee, 
    'completed',
    jsonb_build_object('contest_id', _contest_id)
  );

  -- Return success with new balance
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', current_coins - _entry_fee
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', SQLERRM
    );
END;
$$;

-- Fix contest_entries public exposure - restrict to own entries + admins
DROP POLICY IF EXISTS "Allow viewing all entries for leaderboard" ON contest_entries;

CREATE POLICY "Users see own entries and admins see all" ON contest_entries
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create anonymized leaderboard view (views inherit RLS from underlying tables)
DROP VIEW IF EXISTS leaderboard_view CASCADE;

CREATE VIEW leaderboard_view 
WITH (security_invoker = on) AS
SELECT 
  ce.user_id,
  ce.score,
  ROW_NUMBER() OVER (ORDER BY ce.score DESC) as rank,
  CASE 
    WHEN auth.uid() = ce.user_id OR has_role(auth.uid(), 'admin'::app_role)
    THEN p.full_name
    ELSE 'Player ' || LEFT(ce.user_id::text, 8)
  END as full_name
FROM contest_entries ce
JOIN profiles p ON ce.user_id = p.id;