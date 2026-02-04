-- Enable RLS on dns_records table
ALTER TABLE public.dns_records ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy for dns_records
CREATE POLICY "Only admins can view dns_records" 
ON public.dns_records 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert dns_records" 
ON public.dns_records 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update dns_records" 
ON public.dns_records 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete dns_records" 
ON public.dns_records 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on dns_audit_log table
ALTER TABLE public.dns_audit_log ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy for dns_audit_log
CREATE POLICY "Only admins can view dns_audit_log" 
ON public.dns_audit_log 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix log_dns_changes function search_path
CREATE OR REPLACE FUNCTION public.log_dns_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO dns_audit_log (action, record_name, record_type, record_value, ttl, priority, comment)
        VALUES ('INSERT', NEW.name, NEW.type, NEW.value, NEW.ttl, NEW.priority, NEW.comment);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO dns_audit_log (action, record_name, record_type, record_value, ttl, priority, comment)
        VALUES ('UPDATE', NEW.name, NEW.type, NEW.value, NEW.ttl, NEW.priority, NEW.comment);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO dns_audit_log (action, record_name, record_type, record_value, ttl, priority, comment)
        VALUES ('DELETE', OLD.name, OLD.type, OLD.value, OLD.ttl, OLD.priority, OLD.comment);
        RETURN OLD;
    END IF;
END;
$function$;

-- Fix update_games_news_timestamp function search_path
CREATE OR REPLACE FUNCTION public.update_games_news_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

-- Fix insert_ai_generated_news function search_path
CREATE OR REPLACE FUNCTION public.insert_ai_generated_news()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    response JSON;
BEGIN
    -- Call your Edge Function endpoint
    SELECT content::json INTO response
    FROM http_get('<YOUR_EDGE_FUNCTION_URL>');

    -- Insert the AI-generated article into games_news
    INSERT INTO games_news (title, content, category)
    VALUES (
        response->>'title',
        response->>'content',
        COALESCE(response->>'category', 'AI Digest')
    );
END;
$function$;

-- Fix generate_ai_games_news function search_path
CREATE OR REPLACE FUNCTION public.generate_ai_games_news()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    ai_title TEXT;
    ai_content TEXT;
    ai_category TEXT;
BEGIN
    SELECT 'AI Sports Digest: ' || to_char(NOW(), 'YYYY-MM-DD') INTO ai_title;
    SELECT 'This is an AI-generated article covering today''s esports highlights, transfer rumors, and match previews...' INTO ai_content;
    SELECT 'Daily Digest' INTO ai_category;

    INSERT INTO games_news (title, content, category)
    VALUES (ai_title, ai_content, ai_category);
END;
$function$;