#!/usr/bin/env node
/**
 * PredictPro 24/7 Always-Live Background Keepalive Daemon
 *
 * Runs continuously to ensure the application server never goes idle.
 * Pings local and production health endpoints on a fixed heartbeat and
 * performs database activity queries to prevent Supabase 7-day auto-pause.
 */

const TARGET_URL = process.env.APP_URL || process.env.SITE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const INTERVAL_SECONDS = 180; // 3 minutes

console.log(`[Keepalive Daemon] Starting 24/7 Always-Live Daemon targeting: ${TARGET_URL}`);
console.log(`[Keepalive Daemon] Heartbeat Interval: Every ${INTERVAL_SECONDS} seconds`);

let pingCount = 0;

async function ping() {
  pingCount += 1;
  const now = new Date().toISOString();
  const start = Date.now();
  try {
    // 1. Edge & Web server pulse
    const keepaliveEndpoint = `${TARGET_URL}/api/keepalive`;
    const res = await fetch(keepaliveEndpoint, {
      headers: { 'X-Keepalive-Agent': 'PredictPro-CLI-Daemon/2.5' },
    }).catch(async () => {
      return await fetch(`${TARGET_URL}/api/health`, {
        headers: { 'X-Keepalive-Agent': 'PredictPro-CLI-Daemon/2.5' },
      });
    });

    const elapsed = Date.now() - start;

    // 2. Direct Supabase pulse if key present
    let dbStatus = 'db_standby';
    if (SUPABASE_KEY) {
      try {
        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/jackpot_pools?select=provider_id&limit=1`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
        dbStatus = dbRes.ok ? 'supabase_active' : `supabase_http_${dbRes.status}`;
      } catch (dbErr) {
        dbStatus = `supabase_err: ${dbErr.message}`;
      }
    }

    console.log(`[Keepalive Daemon #${pingCount}] [${now}] HTTP ${res.status} OK (${elapsed}ms) | DB: ${dbStatus}`);
  } catch (err) {
    console.warn(`[Keepalive Daemon #${pingCount}] [${now}] Ping error: ${err.message}`);
  }
}

// Initial ping
ping();

// Run forever
setInterval(ping, INTERVAL_SECONDS * 1000);
