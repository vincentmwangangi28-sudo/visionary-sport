-- Fix referral_codes: restrict full-row SELECT to owner only
DROP POLICY IF EXISTS "Authenticated users can lookup codes" ON public.referral_codes;

CREATE POLICY "Users can view their own referral code"
ON public.referral_codes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix poll_votes: remove public read of user-linked votes; only authenticated users see vote rows.
-- Aggregate vote counts should be derived via a SECURITY DEFINER function or aggregated server-side.
DROP POLICY IF EXISTS "Public read access for poll votes count" ON public.poll_votes;

CREATE POLICY "Authenticated users can view poll votes"
ON public.poll_votes
FOR SELECT
TO authenticated
USING (true);

-- Fix user_streaks: remove user-controlled UPDATE (prevents privilege escalation of streak values).
-- Streaks are updated server-side by edge functions using the service role.
DROP POLICY IF EXISTS "Users can update their streaks" ON public.user_streaks;

-- Add CHECK constraint enforcing chat message length (defense in depth alongside the existing trigger).
ALTER TABLE public.match_chat_messages
  ADD CONSTRAINT match_chat_messages_length_check
  CHECK (char_length(message) > 0 AND char_length(message) <= 500);