// Vercel Serverless / Edge Function: Real Live & 7-Day Fixtures Sync Cron
// Invoked on schedule: "*/5 * * * *" (Every 5 Minutes)

import { handleCronTask } from '../src/server/cronApiHandler';

export default async function handler(request: Request) {
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

  const result = await handleCronTask('sync-live-fixtures');
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
