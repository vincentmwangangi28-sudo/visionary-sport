// Vercel Serverless / Edge Function: Telegram VIP Channel Broadcast Cron
// Invoked on schedule: "0 7 * * *" (Daily at 07:00 AM UTC for morning bankers)

export const config = {
  runtime: 'edge',
};

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const BROADCAST_URL = `${SUPABASE_BASE_URL}/functions/v1/telegram-broadcast`;

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

  let broadcastStatus = 'skipped';
  let broadcastResult: any = null;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    }

    const res = await fetch(BROADCAST_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'broadcast',
        parse_mode: 'HTML',
        message: `🔥 <b>PredictPro AI Morning Banker Picks Ready!</b>\n\nDaily AI Pro Tips and high-confidence Value Bets (+EV) for today are live.\n\n👉 View today's full slate: https://predictpro.guru/predict\n👉 Accumulator Builder: https://predictpro.guru/accumulator\n\n<i>Trade responsibly. Verified AI predictions.</i>`,
      }),
    });

    broadcastStatus = `http_${res.status}`;
    broadcastResult = await res.json().catch(() => null);
  } catch (err) {
    broadcastStatus = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'telegram-vip-broadcast',
      executedAt: now,
      schedule: '0 7 * * * (Daily 07:00 UTC)',
      endpoint: BROADCAST_URL,
      status: broadcastStatus,
      result: broadcastResult,
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
