// Vercel Serverless / Edge Function: Dropping Odds & Value Bets (+EV) Scanner Cron
// Invoked on schedule: "*/20 * * * *" (Every 20 Minutes)

export const config = {
  runtime: 'edge',
};

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const VALUE_BETS_URL = `${SUPABASE_BASE_URL}/functions/v1/find-value-bets`;

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

    const res = await fetch(VALUE_BETS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ trigger: 'scheduled_cron', timestamp: now }),
    });

    status = `http_${res.status}`;
    data = await res.json().catch(() => null);
  } catch (err) {
    status = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'scan-value-bets',
      executedAt: now,
      schedule: '*/20 * * * * (Every 20 Mins)',
      status,
      count: data?.valueBets?.length ?? 0,
      sample: data?.valueBets?.slice(0, 3) ?? [],
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
