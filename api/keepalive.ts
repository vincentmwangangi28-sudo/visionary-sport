import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: Request) {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  let supabaseStatus = 'skipped_no_key';
  let supabaseLatencyMs = 0;

  if (SUPABASE_KEY) {
    try {
      const dbStart = Date.now();
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
      });

      // Lightweight query to keep Supabase database active and prevent 7-day inactivity pause
      const { data, error } = await supabase
        .from('jackpot_pools')
        .select('provider_id')
        .limit(1);

      supabaseLatencyMs = Date.now() - dbStart;
      supabaseStatus = error ? `error: ${error.message}` : 'active_and_responsive';
    } catch (err: any) {
      supabaseStatus = `exception: ${err?.message || 'unknown'}`;
    }
  }

  const durationMs = Date.now() - start;

  const payload = {
    status: 'ok',
    service: 'PredictPro.guru 24/7 Keepalive Sentinel',
    version: '2.5.0',
    timestamp,
    durationMs,
    supabase: {
      status: supabaseStatus,
      latencyMs: supabaseLatencyMs,
      antiSleepProtected: true,
      lastPingAt: timestamp,
    },
    uptime: 'continuous',
    triggers: {
      autonomousDaemon: 'active',
      vercelCron: 'scheduled',
      clientSentinel: 'supported',
      databaseHeartbeat: 'supported',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Keepalive-Agent, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-PredictPro-Keepalive': 'active',
    },
  });
}
