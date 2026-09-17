// Vercel Serverless / Edge Function: 17-Game Mega Jackpot Combination Engine Cron
// Invoked on schedule: "0 12 * * 4" (Every Thursday at 12:00 PM UTC)

export const config = {
  runtime: 'edge',
};

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const PREDICT_URL = `${SUPABASE_BASE_URL}/functions/v1/cron-daily-predictions`;

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

    // Trigger jackpot predictions calculation
    const res = await fetch(PREDICT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        trigger: 'jackpot_engine_cron',
        mode: 'jackpot_17_games',
        timestamp: now,
      }),
    });

    status = `http_${res.status}`;
    data = await res.json().catch(() => null);
  } catch (err) {
    status = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'mega-jackpot-engine',
      executedAt: now,
      schedule: '0 12 * * 4 (Thursdays 12:00 UTC)',
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
