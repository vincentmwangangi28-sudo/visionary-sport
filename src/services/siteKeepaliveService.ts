/**
 * PredictPro 24/7 Always-Live Site Keepalive & Activity Service
 *
 * Keeps the website, serverless Lambdas/Edge functions, and Supabase database
 * continuously active to eliminate cold starts and prevent Supabase 7-day inactivity pause.
 */

import { supabase } from '@/integrations/supabase/client';

export const KEEPALIVE_EVENT = 'predictpro_keepalive_pulse';
export const KEEPALIVE_STORAGE_KEY = 'predictpro_keepalive_stats';
export const KEEPALIVE_CONFIG_KEY = 'predictpro_keepalive_enabled';

export interface KeepaliveTelemetry {
  totalPings: number;
  lastPingAt: string | null;
  lastLatencyMs: number;
  lastStatus: 'active' | 'standby' | 'error' | 'initializing';
  lastError: string | null;
  supabaseProtected: boolean;
  source: string;
  history: Array<{
    timestamp: string;
    latencyMs: number;
    status: string;
    source: string;
  }>;
}

const DEFAULT_TELEMETRY: KeepaliveTelemetry = {
  totalPings: 0,
  lastPingAt: null,
  lastLatencyMs: 0,
  lastStatus: 'initializing',
  lastError: null,
  supabaseProtected: true,
  source: 'browser_sentinel',
  history: [],
};

let activeInterval: any = null;
let isPinging = false;

export function isClientSentinelEnabled(): boolean {
  try {
    const val = localStorage.getItem(KEEPALIVE_CONFIG_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setClientSentinelEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEEPALIVE_CONFIG_KEY, String(enabled));
  } catch {}
  if (!enabled && activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  } else if (enabled && !activeInterval) {
    startClientKeepaliveSentinel();
  }
}

export function getKeepaliveTelemetry(): KeepaliveTelemetry {
  try {
    const raw = localStorage.getItem(KEEPALIVE_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_TELEMETRY, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_TELEMETRY };
}

function saveKeepaliveTelemetry(telemetry: KeepaliveTelemetry): void {
  try {
    localStorage.setItem(KEEPALIVE_STORAGE_KEY, JSON.stringify(telemetry));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(KEEPALIVE_EVENT, { detail: telemetry }));
    }
  } catch {}
}

/**
 * Executes a single keepalive pulse across web endpoint and Supabase
 */
export async function triggerKeepalivePulse(source = 'manual_trigger'): Promise<{
  success: boolean;
  latencyMs: number;
  status: string;
  supabaseStatus: string;
  timestamp: string;
}> {
  if (isPinging) {
    const current = getKeepaliveTelemetry();
    return {
      success: true,
      latencyMs: current.lastLatencyMs,
      status: 'concurrent_in_flight',
      supabaseStatus: 'active',
      timestamp: current.lastPingAt || new Date().toISOString(),
    };
  }

  isPinging = true;
  const start = Date.now();
  const timestamp = new Date().toISOString();
  let endpointSuccess = false;
  let supabaseStatus = 'standby';

  try {
    // 1. Ping the /api/keepalive endpoint (falls back to /api/health) with timeout
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;
    try {
      const apiRes = await fetch('/api/keepalive', {
        method: 'GET',
        headers: { 'X-Keepalive-Agent': `PredictPro-ClientSentinel/${source}` },
        signal: controller?.signal,
      }).catch(async () => {
        return await fetch('/api/health', {
          headers: { 'X-Keepalive-Agent': `PredictPro-ClientSentinel/${source}` },
          signal: controller?.signal,
        }).catch(() => null);
      });

      if (apiRes && apiRes.ok) {
        endpointSuccess = true;
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    // 2. Direct ping to Supabase to keep PostgreSQL free-tier database unpaused (fast 2s timeout)
    try {
      const dbStart = Date.now();
      const dbPromise = supabase
        .from('jackpot_pools')
        .select('provider_id')
        .limit(1);

      const timeoutPromise = new Promise<{ error: any }>((resolve) =>
        setTimeout(() => resolve({ error: { message: 'db_timeout' } }), 2000)
      );

      const res: any = await Promise.race([dbPromise, timeoutPromise]);

      if (!res?.error) {
        supabaseStatus = `ok_${Date.now() - dbStart}ms`;
      } else {
        supabaseStatus = 'db_standby';
      }
    } catch (dbErr: any) {
      supabaseStatus = `db_exception: ${dbErr?.message || 'timeout'}`;
    }

    const latencyMs = Date.now() - start;
    const prev = getKeepaliveTelemetry();
    const newEntry = {
      timestamp,
      latencyMs,
      status: endpointSuccess ? 'active' : 'local_standby',
      source,
    };

    const updated: KeepaliveTelemetry = {
      totalPings: prev.totalPings + 1,
      lastPingAt: timestamp,
      lastLatencyMs: latencyMs,
      lastStatus: 'active',
      lastError: null,
      supabaseProtected: true,
      source,
      history: [newEntry, ...(prev.history || [])].slice(0, 20),
    };

    saveKeepaliveTelemetry(updated);

    return {
      success: true,
      latencyMs,
      status: updated.lastStatus,
      supabaseStatus,
      timestamp,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const prev = getKeepaliveTelemetry();
    const updated: KeepaliveTelemetry = {
      ...prev,
      lastPingAt: timestamp,
      lastLatencyMs: latencyMs,
      lastStatus: 'error',
      lastError: err?.message || 'Unknown network error',
      source,
    };
    saveKeepaliveTelemetry(updated);
    return {
      success: false,
      latencyMs,
      status: 'error',
      supabaseStatus: 'failed',
      timestamp,
    };
  } finally {
    isPinging = false;
  }
}

/**
 * Initializes the client-side background sentinel.
 * Automatically pings every 3 minutes while the tab/app is running.
 */
export function startClientKeepaliveSentinel(): void {
  if (typeof window === 'undefined') return;
  if (!isClientSentinelEnabled()) return;
  if (activeInterval) return;

  // Immediate non-blocking warmup pulse after 5 seconds
  setTimeout(() => {
    triggerKeepalivePulse('client_boot').catch(() => {});
  }, 5000);

  // Ping every 3 minutes (180,000 ms)
  activeInterval = setInterval(() => {
    triggerKeepalivePulse('heartbeat_timer').catch(() => {});
  }, 3 * 60 * 1000);

  // Wake up when the user returns to the tab after being away
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const current = getKeepaliveTelemetry();
      if (!current.lastPingAt) {
        triggerKeepalivePulse('visibility_resume').catch(() => {});
        return;
      }
      const elapsedMs = Date.now() - new Date(current.lastPingAt).getTime();
      // If away for more than 2 minutes, fire immediate refresh pulse
      if (elapsedMs > 2 * 60 * 1000) {
        triggerKeepalivePulse('visibility_resume').catch(() => {});
      }
    }
  });
}

export function stopClientKeepaliveSentinel(): void {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
}
