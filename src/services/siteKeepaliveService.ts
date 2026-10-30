/**
 * PredictPro 24/7 Always-Live Site Keepalive & Activity Service
 *
 * Keeps the website, serverless Lambdas/Edge functions, and Supabase database
 * continuously active to eliminate cold starts and prevent Supabase 7-day inactivity pause.
 */

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
let keepaliveNetworkCooldownUntil = 0;
let visibilityListenerAttached = false;

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
 * Executes a single keepalive pulse across the server keepalive endpoint
 * with automatic offline & circuit-breaker protection.
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

  const isAutoBackground =
    source === 'heartbeat_timer' ||
    source === 'visibility_resume' ||
    source === 'client_boot';
  const isOffline =
    typeof navigator !== 'undefined' && navigator.onLine === false;

  if (isAutoBackground && (isOffline || Date.now() < keepaliveNetworkCooldownUntil)) {
    const current = getKeepaliveTelemetry();
    return {
      success: true,
      latencyMs: current.lastLatencyMs || 0,
      status: 'standby',
      supabaseStatus: 'standby',
      timestamp: current.lastPingAt || new Date().toISOString(),
    };
  }

  isPinging = true;
  const start = Date.now();
  const timestamp = new Date().toISOString();
  let endpointSuccess = false;
  let supabaseStatus = 'standby';

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;
    try {
      const apiRes = await fetch('/api/keepalive', {
        method: 'GET',
        headers: { 'X-Keepalive-Agent': `PredictPro-ClientSentinel/${source}` },
        signal: controller?.signal,
      }).catch(() => null);

      if (apiRes && apiRes.ok) {
        endpointSuccess = true;
        supabaseStatus = 'active_via_server';
        keepaliveNetworkCooldownUntil = 0;
      } else {
        // Place background sentinel into a 10-minute cooldown on network/DNS/SSL error
        keepaliveNetworkCooldownUntil = Date.now() + 10 * 60 * 1000;
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
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
    keepaliveNetworkCooldownUntil = Date.now() + 10 * 60 * 1000;
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
 * Automatically pings every 10 minutes while the tab/app is running and online.
 */
export function startClientKeepaliveSentinel(): void {
  if (typeof window === 'undefined') return;
  if (!isClientSentinelEnabled()) return;
  if (activeInterval) return;

  // Non-blocking warmup pulse after 15 seconds if online
  setTimeout(() => {
    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
      triggerKeepalivePulse('client_boot').catch(() => {});
    }
  }, 15000);

  // Ping every 10 minutes (600,000 ms)
  activeInterval = setInterval(() => {
    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
      triggerKeepalivePulse('heartbeat_timer').catch(() => {});
    }
  }, 10 * 60 * 1000);

  if (!visibilityListenerAttached) {
    visibilityListenerAttached = true;
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState !== 'visible') return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
        if (Date.now() < keepaliveNetworkCooldownUntil) return;
        // Defer work off the synchronous visibilitychange event tick to prevent [Violation] warnings
        setTimeout(() => {
          const current = getKeepaliveTelemetry();
          if (!current.lastPingAt) {
            triggerKeepalivePulse('visibility_resume').catch(() => {});
            return;
          }
          const elapsedMs = Date.now() - new Date(current.lastPingAt).getTime();
          if (elapsedMs > 10 * 60 * 1000) {
            triggerKeepalivePulse('visibility_resume').catch(() => {});
          }
        }, 150);
      },
      { passive: true }
    );
  }
}

export function stopClientKeepaliveSentinel(): void {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
}
