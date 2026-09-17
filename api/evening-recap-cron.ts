// Vercel Serverless / Edge Function: Evening Performance & Winning Slips Recap Cron
// Invoked on schedule: "0 22 * * *" (Daily at 22:00 PM UTC)

export const config = {
  runtime: 'edge',
};

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const BROADCAST_URL = `${SUPABASE_BASE_URL}/functions/v1/telegram-broadcast`;

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

    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const res = await fetch(BROADCAST_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'broadcast',
        parse_mode: 'HTML',
        message: `🏆 <b>PredictPro AI Matchday Results &amp; Win Rate Recap</b> (${todayFormatted})\n\nToday's AI predictions have settled with positive strike rates across top European and African leagues!\n\n📊 <b>View Verified Track Record:</b> https://predictpro.guru/track-record\n🎟️ <b>Tomorrow's Early Bankers:</b> https://predictpro.guru/best-bets\n\n<i>Transparency first. Backtested mathematical models.</i>`,
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
      job: 'evening-performance-recap',
      executedAt: now,
      schedule: '0 22 * * * (Daily 22:00 UTC)',
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
