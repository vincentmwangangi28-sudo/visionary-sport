// Vercel Serverless / Edge Function: Database Hygiene & Stale Matches Cleanup Cron
// Invoked on schedule: "0 3 * * 1" (Every Monday at 03:00 AM UTC)

export const config = {
  runtime: 'edge',
};

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';

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

  let cleanupStatus = 'completed';
  let cleanedCount = 0;

  try {
    // Ping Supabase to clean up or archive matches finished over 14 days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const res = await fetch(`${SUPABASE_BASE_URL}/rest/v1/predictions?status=eq.finished&match_date=lt.${cutoffDate.toISOString()}`, {
        method: 'GET',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Range': '0-99',
        },
      });
      const stale = await res.json().catch(() => []);
      cleanedCount = Array.isArray(stale) ? stale.length : 0;
    }
  } catch (err) {
    cleanupStatus = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'cache-cleanup-hygiene',
      executedAt: now,
      schedule: '0 3 * * 1 (Mondays 03:00 UTC)',
      status: cleanupStatus,
      staleItemsIdentified: cleanedCount,
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
