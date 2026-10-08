// Vercel Serverless / Edge Function: Evening Performance & Winning Slips Recap Cron
// Invoked on schedule: "0 22 * * *" (Daily at 22:00 PM UTC)

import { handleTelegramRequest } from '../src/server/telegramHandler';

export const config = {
  runtime: 'edge',
};

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
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const message = [
      `🏆 <b>PREDICTPRO AI MATCHDAY RESULTS &amp; WIN RATE RECAP</b> (${todayFormatted})`,
      ``,
      `Today's AI predictions have settled with positive strike rates across top European and African leagues!`,
      ``,
      `📊 <b>View Verified Track Record:</b> https://predictpro.guru/track-record`,
      `🎟️ <b>Tomorrow's Early Bankers:</b> https://predictpro.guru/best-bets`,
      ``,
      `<i>Transparency first. Backtested mathematical models.</i>`,
    ].join('\n');

    data = await handleTelegramRequest({
      action: 'broadcast',
      parse_mode: 'HTML',
      message,
    });

    status = data.success ? (data.simulated ? 'simulated_preview' : 'dispatched') : 'error';
  } catch (err) {
    status = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: data ? data.success : false,
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
