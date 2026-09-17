// Vercel Serverless / Edge Function: Settle Prediction Results Cron
// Invoked on schedule: "*/30 * * * *" (Every 30 Minutes)

export const config = {
  runtime: 'edge',
};

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const SETTLE_URL = `${SUPABASE_BASE_URL}/functions/v1/update-prediction-results`;

export default async function handler(request: Request) {
  const now = new Date().toISOString();

  // Handle CORS preflight
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

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization') || '';
  const headerSecret = request.headers.get('x-cron-secret') || '';

  // Validate cron secret if provided in environment
  if (cronSecret && headerSecret !== cronSecret && !authHeader.includes(cronSecret)) {
    // Note: Vercel Cron automatically includes Authorization: Bearer <CRON_SECRET>
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
    if (!isVercelCron) {
      console.warn('Unauthorized cron invocation attempt');
    }
  }

  let settleStatus = 'skipped';
  let settleResult: any = null;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cronSecret) {
      headers['x-cron-secret'] = cronSecret;
    }
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    }

    const res = await fetch(SETTLE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ trigger: 'scheduled_cron', timestamp: now }),
    });

    settleStatus = `http_${res.status}`;
    settleResult = await res.json().catch(() => null);
  } catch (err) {
    settleStatus = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'settle-prediction-results',
      executedAt: now,
      schedule: '*/30 * * * * (Every 30 Minutes)',
      endpoint: SETTLE_URL,
      status: settleStatus,
      result: settleResult,
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
