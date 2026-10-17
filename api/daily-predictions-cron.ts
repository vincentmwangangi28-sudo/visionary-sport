// Vercel Serverless / Edge Function: Daily Predictions Generation Cron
// Invoked on schedule: "0 4 * * *" (Daily at 04:00 AM UTC)

import { handleFootballRequest } from '../src/server/footballHandler';

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

  let genStatus = 'synced_edge';
  let genResult: any = null;

  try {
    const footballData = await handleFootballRequest({ type: 'upcoming' });
    genResult = {
      upcomingCount: Array.isArray(footballData?.matches) ? footballData.matches.length : 0,
    };

    if (IS_CUSTOM_SUPABASE) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      };
      if (process.env.CRON_SECRET) {
        headers['x-cron-secret'] = process.env.CRON_SECRET;
      }

      const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/cron-daily-predictions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ trigger: 'scheduled_daily_cron', timestamp: now }),
      });

      genStatus = `http_${res.status}`;
    }
  } catch (err) {
    genStatus = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'generate-daily-predictions',
      executedAt: now,
      schedule: '0 4 * * * (Daily 04:00 UTC)',
      status: genStatus,
      result: genResult,
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
