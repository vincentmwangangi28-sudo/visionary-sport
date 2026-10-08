#!/usr/bin/env node
/**
 * PredictPro 24/7 Always-Live Background Keepalive Daemon
 *
 * Runs continuously to ensure the application server never goes idle.
 * Pings local and production health endpoints on a fixed heartbeat.
 */

const TARGET_URL = process.env.APP_URL || process.env.SITE_URL || 'http://localhost:3000';
const INTERVAL_SECONDS = 180; // 3 minutes

console.log(`[Keepalive Daemon] Starting 24/7 Always-Live Daemon targeting: ${TARGET_URL}`);
console.log(`[Keepalive Daemon] Heartbeat Interval: Every ${INTERVAL_SECONDS} seconds`);

let pingCount = 0;

async function ping() {
  pingCount += 1;
  const now = new Date().toISOString();
  try {
    const res = await fetch(`${TARGET_URL}/api/health`, {
      headers: { 'X-Keepalive-Agent': 'PredictPro-CLI-Daemon/1.0' },
    });
    console.log(`[Keepalive Daemon #${pingCount}] [${now}] HTTP ${res.status} OK`);
  } catch (err) {
    console.warn(`[Keepalive Daemon #${pingCount}] [${now}] Ping error: ${err.message}`);
  }
}

// Initial ping
ping();

// Run forever
setInterval(ping, INTERVAL_SECONDS * 1000);
