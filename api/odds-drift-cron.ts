// Vercel Serverless / Edge Function: Odds Drift & Starting Lineups Radar Cron
// Invoked on schedule: "*/15 11-22 * * *" (Every 15 Mins during matchday hours)

export const config = {
  runtime: 'edge',
};

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const ODDS_URL = `${SUPABASE_BASE_URL}/functions/v1/fetch-odds`;

export default async function handler(request: Request) {
  const now = new Date().toISOString();

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-cron-secret',
      },
    });
  }

  let status = 'skipped';
  let data: any = null;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    }

    const res = await fetch(ODDS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ trigger: 'odds_drift_cron', timestamp: now }),
    });

    status = `http_${res.status}`;
    data = await res.json().catch(() => null);
  } catch (err) {
    status = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'odds-drift-scanner',
      executedAt: now,
      schedule: '*/15 * * * * (Every 15 Mins)',
      status,
      result: data,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
