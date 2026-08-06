REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_dns_changes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_games_news_timestamp() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_chat_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_poll_vote() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_ai_games_news() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.insert_ai_generated_news() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_spin_today(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enter_contest_atomic(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unlock_prediction(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_spin_today(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enter_contest_atomic(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlock_prediction(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_ai_games_news() TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_ai_generated_news() TO service_role;