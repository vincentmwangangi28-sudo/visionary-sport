// Vercel Serverless / Edge Function: League Standings & Form Matrix Sync Cron
// Invoked on schedule: "0 2 * * *" (Daily at 02:00 AM UTC)

export const config = {
  runtime: 'edge',
};

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || '';
const IS_CUSTOM_SUPABASE = Boolean(
  SUPABASE_BASE_URL &&
  !SUPABASE_BASE_URL.includes('bhgjlhgevyggkhyytulv.supabase.co') &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  let status = 'synced_edge_cache';
  let data: any = null;

  if (IS_CUSTOM_SUPABASE) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      };

      const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/fetch-standings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ trigger: 'standings_sync_cron', timestamp: now }),
      });

      status = `http_${res.status}`;
      data = await res.json().catch(() => null);
    } catch (err) {
      status = err instanceof Error ? err.message : 'error';
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'sync-league-standings',
      executedAt: now,
      schedule: '0 2 * * * (Daily 02:00 UTC)',
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
