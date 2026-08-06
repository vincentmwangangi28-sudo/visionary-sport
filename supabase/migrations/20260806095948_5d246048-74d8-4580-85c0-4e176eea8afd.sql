REVOKE ALL ON public.mv_recent_articles FROM anon, authenticated;
REVOKE ALL ON public.mv_featured_article FROM anon, authenticated;

-- Internal / trigger-only functions: not callable via the API at all
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.log_dns_changes() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_games_news_timestamp() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_chat_message() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_poll_vote() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_ai_games_news() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.insert_ai_generated_news() FROM anon, authenticated;

-- App functions: signed-in users only
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE ALL ON FUNCTION public.can_spin_today(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.enter_contest_atomic(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.unlock_prediction(uuid, integer) FROM anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_spin_today(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enter_contest_atomic(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_prediction(uuid, integer) TO authenticated;