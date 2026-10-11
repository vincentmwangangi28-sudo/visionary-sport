-- ============================================================================
-- PredictPro 24/7 Site Activity Sentinel & Anti-Inactivity PostgreSQL Triggers
-- Prevents Supabase project sleep (7-day pause rule) and maintains continuous heartbeat
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_heartbeats (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'autonomous_sentinel',
  status TEXT NOT NULL DEFAULT 'active',
  latency_ms INTEGER DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy queries on latest heartbeat
CREATE INDEX IF NOT EXISTS idx_site_heartbeats_created_at ON public.site_heartbeats (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_heartbeats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_heartbeats' AND policyname = 'Public read access for site_heartbeats'
  ) THEN
    CREATE POLICY "Public read access for site_heartbeats"
      ON public.site_heartbeats FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_heartbeats' AND policyname = 'Allow insert from authenticated and anon'
  ) THEN
    CREATE POLICY "Allow insert from authenticated and anon"
      ON public.site_heartbeats FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- Heartbeat Recording Function (Inserts heartbeat & prunes logs > 14 days)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_site_heartbeat(
  p_source TEXT DEFAULT 'web_client',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
  v_timestamp TIMESTAMPTZ := now();
BEGIN
  INSERT INTO public.site_heartbeats (source, status, metadata, created_at)
  VALUES (COALESCE(p_source, 'web_client'), 'active', COALESCE(p_metadata, '{}'::jsonb), v_timestamp)
  RETURNING id INTO v_id;

  -- Maintain table hygiene: delete heartbeats older than 14 days
  DELETE FROM public.site_heartbeats
  WHERE created_at < now() - INTERVAL '14 days';

  RETURN json_build_object(
    'success', true,
    'heartbeat_id', v_id,
    'recorded_at', v_timestamp,
    'source', p_source,
    'status', 'database_active'
  )::jsonb;
END;
$$;

-- Seed an initial heartbeat
SELECT public.record_site_heartbeat('migration_setup', '{"initialized": true}'::jsonb);

-- ============================================================================
-- Scheduled pg_cron Jobs: Continuous Site & Supabase Activity Trigger
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- 1. Every 5 minutes: Record database pulse to prevent Supabase 7-day auto-pause
    PERFORM cron.schedule(
      'predictpro-db-keepalive-5m',
      '*/5 * * * *',
      $cron$
        SELECT public.record_site_heartbeat('pg_cron_5m', '{"trigger": "anti_sleep_sentinel"}'::jsonb);
      $cron$
    );

    -- 2. Every 10 minutes: Web Ping to Vercel production edge keepalive endpoint
    PERFORM cron.schedule(
      'predictpro-web-edge-ping-10m',
      '*/10 * * * *',
      $cron$
        SELECT net.http_get(
          url := 'https://predictpro.guru/api/keepalive',
          headers := '{"User-Agent": "PredictPro-PostgreSQL-pg_cron/2.5"}'::jsonb
        );
      $cron$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron / pg_net extension not enabled or simulated in current environment. Client & Server Sentinels active.';
END $$;
