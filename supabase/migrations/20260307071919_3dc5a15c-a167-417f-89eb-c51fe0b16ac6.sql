-- Add server-side message length validation trigger for chat messages
CREATE OR REPLACE FUNCTION public.validate_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enforce length limits
  IF length(NEW.message) < 1 OR length(NEW.message) > 500 THEN
    RAISE EXCEPTION 'Message must be between 1 and 500 characters';
  END IF;
  
  -- Strip HTML tags server-side
  NEW.message := regexp_replace(NEW.message, '<[^>]*>', '', 'g');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_chat_message_trigger
BEFORE INSERT ON public.match_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_chat_message();

-- Add validation for poll_votes option_index (must be non-negative)
CREATE OR REPLACE FUNCTION public.validate_poll_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  poll_options jsonb;
  options_count int;
BEGIN
  -- Validate option_index is non-negative
  IF NEW.option_index < 0 THEN
    RAISE EXCEPTION 'Invalid option index';
  END IF;
  
  -- Validate option_index is within bounds of poll options
  SELECT options INTO poll_options FROM public.polls WHERE id = NEW.poll_id;
  
  IF poll_options IS NULL THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;
  
  options_count := jsonb_array_length(poll_options);
  
  IF NEW.option_index >= options_count THEN
    RAISE EXCEPTION 'Option index out of range';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_poll_vote_trigger
BEFORE INSERT ON public.poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.validate_poll_vote();