import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const DEFAULT_SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export default async function handler(_req: Request) {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  let supabaseStatus = 'standby';
  let supabaseLatencyMs = 0;

  try {
    const dbStart = Date.now();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Lightweight query on predictions table to keep Supabase database active and prevent 7-day inactivity pause
    const { error } = await supabase
      .from('predictions')
      .select('id')
      .limit(1);

    supabaseLatencyMs = Date.now() - dbStart;
    supabaseStatus = error ? `error: ${error.message}` : 'active_and_responsive';
  } catch (err: any) {
    supabaseStatus = `exception: ${err?.message || 'unknown'}`;
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
