-- ============================================================================
-- Official SportPesa, Betika & Mozzart Jackpot Pools, Database Triggers & pg_cron Jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.jackpot_pools (
  provider_id TEXT PRIMARY KEY,
  pool_name TEXT NOT NULL,
  prize_pool TEXT NOT NULL,
  base_stake NUMERIC DEFAULT 99,
  currency_symbol TEXT DEFAULT 'KSh',
  game_count INTEGER NOT NULL DEFAULT 17,
  matches_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_cron_trigger TEXT DEFAULT 'pg_cron',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jackpot_matches (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES public.jackpot_pools(provider_id) ON DELETE CASCADE,
  pos INTEGER NOT NULL,
  sms_id TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_logo TEXT,
  away_logo TEXT,
  league TEXT NOT NULL,
  kickoff_iso TIMESTAMPTZ NOT NULL,
  home_odds NUMERIC(6,2) NOT NULL,
  draw_odds NUMERIC(6,2) NOT NULL,
  away_odds NUMERIC(6,2) NOT NULL,
  recommended_pick TEXT NOT NULL,
  double_chance TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jackpot_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpot_matches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jackpot_pools' AND policyname = 'Public read access for jackpot_pools'
  ) THEN
    CREATE POLICY "Public read access for jackpot_pools"
      ON public.jackpot_pools FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jackpot_matches' AND policyname = 'Public read access for jackpot_matches'
  ) THEN
    CREATE POLICY "Public read access for jackpot_matches"
      ON public.jackpot_matches FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================================
-- PostgreSQL Trigger Function: Auto-update timestamp, match count & pg_notify
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_on_jackpot_pool_or_match_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at := now();

  IF TG_TABLE_NAME = 'jackpot_pools' AND NEW.matches_json IS NOT NULL THEN
    NEW.game_count := jsonb_array_length(NEW.matches_json);
  END IF;

  PERFORM pg_notify(
    'jackpot_pool_updated',
    json_build_object(
      'table', TG_TABLE_NAME,
      'provider_id', COALESCE(NEW.provider_id, ''),
      'updated_at', NEW.updated_at
    )::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jackpot_pools_before_upsert ON public.jackpot_pools;
CREATE TRIGGER trg_jackpot_pools_before_upsert
  BEFORE INSERT OR UPDATE ON public.jackpot_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_on_jackpot_pool_or_match_change();

DROP TRIGGER IF EXISTS trg_jackpot_matches_before_upsert ON public.jackpot_matches;
CREATE TRIGGER trg_jackpot_matches_before_upsert
  BEFORE INSERT OR UPDATE ON public.jackpot_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_on_jackpot_pool_or_match_change();

-- ============================================================================
-- Scheduled pg_cron Jobs (Runs every 30 minutes + Tuesday/Thursday Rollover Windows)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- 1. Every 30 minutes: Fetch & update official SportPesa + Betika jackpot matches & odds
    PERFORM cron.schedule(
      'sportpesa-betika-jackpot-sync-30m',
      '*/30 * * * *',
      $cron$
        SELECT net.http_post(
          url := 'https://predictpro.guru/api/jackpot-cron',
          headers := '{"Content-Type": "application/json", "x-cron-trigger": "pg_cron_30m"}'::jsonb,
          body := '{"trigger": "pg_cron_30m"}'::jsonb
        );
      $cron$
    );

    -- 2. Tuesdays 09:00 UTC: Midweek Jackpot Release Window (SportPesa 13 & Betika 15M)
    PERFORM cron.schedule(
      'jackpot-midweek-release-tue',
      '0 9 * * 2',
      $cron$
        SELECT net.http_post(
          url := 'https://predictpro.guru/api/jackpot-cron',
          headers := '{"Content-Type": "application/json", "x-cron-trigger": "midweek_release"}'::jsonb,
          body := '{"trigger": "midweek_release"}'::jsonb
        );
      $cron$
    );

    -- 3. Wednesdays & Thursdays 10:00 UTC: Mega Jackpot Pro 17 & Betika 50M Release Window
    PERFORM cron.schedule(
      'jackpot-mega-release-wed-thu',
      '0 10 * * 3,4',
      $cron$
        SELECT net.http_post(
          url := 'https://predictpro.guru/api/jackpot-cron',
          headers := '{"Content-Type": "application/json", "x-cron-trigger": "mega_release"}'::jsonb,
          body := '{"trigger": "mega_release"}'::jsonb
        );
      $cron$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron / pg_net extension not active in local environment; Vercel & Server Cron active.';
END $$;
