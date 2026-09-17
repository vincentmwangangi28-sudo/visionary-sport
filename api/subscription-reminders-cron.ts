// Vercel Serverless / Edge Function: VIP Subscription Expiry & Renewal Reminders Cron
// Invoked on schedule: "0 9 * * *" (Daily at 09:00 AM UTC)

export const config = {
  runtime: 'edge',
};

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const REMINDERS_URL = `${SUPABASE_BASE_URL}/functions/v1/cron-subscription-reminders`;

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
    if (process.env.CRON_SECRET) {
      headers['x-cron-secret'] = process.env.CRON_SECRET;
    }
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    }

    const res = await fetch(REMINDERS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ trigger: 'subscription_reminders_cron', timestamp: now }),
    });

    status = `http_${res.status}`;
    data = await res.json().catch(() => null);
  } catch (err) {
    status = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'subscription-expiry-reminders',
      executedAt: now,
      schedule: '0 9 * * * (Daily 09:00 UTC)',
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
