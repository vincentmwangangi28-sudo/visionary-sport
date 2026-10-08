// Vercel Serverless / Edge Function: Telegram VIP Channel Broadcast Cron
// Invoked on schedule: "0 7 * * *" (Daily at 07:00 AM UTC for morning bankers)

import { handleTelegramRequest } from '../src/server/telegramHandler';

export const config = {
  runtime: 'edge',
};

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
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const message = [
      `🔥 <b>PREDICTPRO AI MORNING BANKER PICKS (${todayFormatted})</b> 🔥`,
      ``,
      `Daily AI Pro Tips and high-confidence Value Bets (+EV) for today are live!`,
      ``,
      `👉 <b>Today's Verified Predictions:</b> https://predictpro.guru/predict`,
      `🎟️ <b>AI Accumulator Builder:</b> https://predictpro.guru/accumulator`,
      `💎 <b>Value Scanner (+EV):</b> https://predictpro.guru/value-bets`,
      ``,
      `<i>Mathematical probability models. 18+ Gamble responsibly.</i>`,
    ].join('\n');

    broadcastResult = await handleTelegramRequest({
      action: 'broadcast',
      parse_mode: 'HTML',
      message,
    });

    broadcastStatus = broadcastResult.success ? (broadcastResult.simulated ? 'simulated_preview' : 'dispatched') : 'error';
  } catch (err) {
    broadcastStatus = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: broadcastResult ? broadcastResult.success : false,
      job: 'telegram-vip-broadcast',
      executedAt: now,
      schedule: '0 7 * * * (Daily 07:00 UTC)',
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
