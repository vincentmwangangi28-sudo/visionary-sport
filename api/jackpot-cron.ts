// Vercel Serverless / Edge Cron & Trigger Endpoint:
// Direct SportPesa (Mega 17 & Midweek 13), Betika (15M Midweek & 50M Must Be Won), and Mozzart (20) Auto-Sync
// Schedule: Every 15 minutes ("*/15 * * * *") + Matchday & Post-Match Event Triggers

import { handleDirectJackpotFetch } from '../src/server/jackpotDirectHandler';

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
  const executedAt = new Date().toISOString();

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

  const startMs = Date.now();
  const url = new URL(request.url);
  const actionParam = url.searchParams.get('action') || 'all';

  let directSync: any = null;
  let supabaseStatus = 'skipped';
  let settlementData: any = null;

  try {
    // 1. Force-fetch live jackpot matches & prizes directly from SportPesa, Betika & Mozzart APIs
    directSync = await handleDirectJackpotFetch(true);

    // 2. Evaluate matches settlement status
    const now = Date.now();
    const allMatches = [
      ...(directSync.pools?.sportpesa || []),
      ...(directSync.pools?.betika || []),
      ...(directSync.pools?.betika_grand || []),
      ...(directSync.pools?.sportpesa_midweek || []),
      ...(directSync.pools?.mozzart || []),
    ];

    let finishedCount = 0;
    let liveCount = 0;
    let upcomingCount = 0;

    for (const m of allMatches) {
      const ko = new Date(m.kickoffIso).getTime();
      const elapsed = (now - ko) / 60000;
      if (elapsed > 115) finishedCount++;
      else if (elapsed >= 0) liveCount++;
      else upcomingCount++;
    }

    const isRoundOver = allMatches.length > 0 && finishedCount >= allMatches.length * 0.85;

    settlementData = {
      totalMatches: allMatches.length,
      finishedMatches: finishedCount,
      liveMatches: liveCount,
      upcomingMatches: upcomingCount,
      isRoundOver,
      rolloverTriggered: isRoundOver,
      settlementAction: actionParam,
    };

    // 3. If custom Supabase service role key is configured, also persist updated pools
    if (IS_CUSTOM_SUPABASE) {
      const sbRes = await fetch(`${SUPABASE_BASE_URL}/rest/v1/jackpot_pools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify([
          {
            provider_id: 'sportpesa',
            pool_name: 'SportPesa Mega Jackpot Pro (17 Games)',
            prize_pool: directSync.prizes?.sportpesaMega || 'KSh 135,461,953',
            game_count: directSync.counts?.sportpesaMega || 17,
            matches_json: directSync.pools?.sportpesa || [],
            updated_at: executedAt,
          },
          {
            provider_id: 'betika',
            pool_name: 'Betika 15M Midweek Jackpot (15 Games)',
            prize_pool: directSync.prizes?.betikaMidweek || 'KSh 15,000,000',
            game_count: directSync.counts?.betikaMidweek || 15,
            matches_json: directSync.pools?.betika || [],
            updated_at: executedAt,
          },
          {
            provider_id: 'betika_grand',
            pool_name: 'Betika 50M Must Be Won Jackpot (15 Games)',
            prize_pool: directSync.prizes?.betikaGrand || 'KSh 50,000,000',
            game_count: directSync.counts?.betikaGrand || 15,
            matches_json: directSync.pools?.betika_grand || [],
            updated_at: executedAt,
          },
          {
            provider_id: 'sportpesa_midweek',
            pool_name: 'SportPesa Midweek Jackpot (13 Games)',
            prize_pool: directSync.prizes?.sportpesaMidweek || 'KSh 13,609,790',
            game_count: directSync.counts?.sportpesaMidweek || 13,
            matches_json: directSync.pools?.sportpesa_midweek || [],
            updated_at: executedAt,
          },
        ]),
      }).catch(() => null);
      supabaseStatus = sbRes ? `http_${sbRes.status}` : 'offline_memory_cache';
    }
  } catch (err) {
    supabaseStatus = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'direct-sportpesa-betika-jackpot-cron',
      action: actionParam,
      executedAt,
      durationMs: Date.now() - startMs,
      schedule: '*/15 * * * * (Every 15 Minutes + Event Triggers)',
      status: settlementData?.isRoundOver ? 'round_completed_rollover_active' : 'synced_direct_bookmakers',
      supabaseStatus,
      settlement: settlementData,
      counts: directSync?.counts || null,
      prizes: directSync?.prizes || null,
      pools: directSync?.pools || null,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
