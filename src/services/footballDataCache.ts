/**
 * Dedicated Caching Layer & Request Deduplicator for Football Data APIs
 * 
 * Features:
 * 1. Multi-tier caching (In-Memory Map + SessionStorage)
 * 2. In-flight Promise coalescing to deduplicate redundant parallel requests
 * 3. Automatic Circuit Breaker & Host Cooldown for rate-limited (429) & quota-exceeded (403) hosts
 * 4. Granular cache keys for leagues, dates, standings, and live scores
 */

export const CACHE_TTLS = {
  LIVE_MATCHES: 35_000,            // 35 seconds for live matches
  LIVE_SCORES: 35_000,             // 35 seconds for live scoreboards
  UPCOMING_FIXTURES: 10 * 60_000,  // 10 minutes for upcoming fixtures
  MATCHES_BY_DATE: 15 * 60_000,    // 15 minutes for date queries
  STANDINGS: 20 * 60_000,          // 20 minutes for league standings
  LEAGUES: 12 * 60 * 60_000,       // 12 hours for league definitions
  H2H_AND_DETAILS: 30 * 60_000,    // 30 minutes for h2h / fixture details
};

interface CacheRecord<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheRecord<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const hostCooldowns = new Map<string, number>();

const SESSION_PREFIX = 'predictpro_fc_v4_';
const COOLDOWN_STORAGE_KEY = 'predictpro_host_cooldowns';

// Initialize host cooldowns from sessionStorage and localStorage on startup
try {
  if (typeof window !== 'undefined') {
    const raw = sessionStorage.getItem(COOLDOWN_STORAGE_KEY) || localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const now = Date.now();
      for (const [host, exp] of Object.entries(parsed)) {
        if (host !== 'site.api.espn.com' && typeof exp === 'number' && exp > now) {
          hostCooldowns.set(host, exp);
        }
      }
    }
  }
} catch {
  // Ignore storage read error
}

function persistHostCooldowns() {
  try {
    if (typeof window !== 'undefined') {
      const obj: Record<string, number> = {};
      const now = Date.now();
      for (const [host, exp] of hostCooldowns.entries()) {
        if (exp > now) {
          obj[host] = exp;
        }
      }
      const serialized = JSON.stringify(obj);
      sessionStorage.setItem(COOLDOWN_STORAGE_KEY, serialized);
      localStorage.setItem(COOLDOWN_STORAGE_KEY, serialized);
    }
  } catch {
    // Ignore storage write error
  }
}

/**
 * Check if an API host is currently in cooldown due to 429/403 status.
 */
export function isHostInCooldown(host: string): boolean {
  if (!host) return false;
  const cleanHost = host.toLowerCase().trim();
  const cd = hostCooldowns.get(cleanHost);
  if (!cd) return false;
  if (Date.now() > cd) {
    hostCooldowns.delete(cleanHost);
    persistHostCooldowns();
    return false;
  }
  return true;
}

/**
 * Place a host into cooldown to prevent redundant network spam when rate limits or quotas are hit.
 * If one RapidAPI Free Football host hits 429/403, cool down its sibling mirror host as well since they share quota.
 */
export function setHostCooldown(host: string, durationMs = 1_800_000, persist = true) {
  if (!host) return;
  const cleanHost = host.toLowerCase().trim();
  const expiresAt = Date.now() + durationMs;
  hostCooldowns.set(cleanHost, expiresAt);
  if (cleanHost.includes('free-api-live-football-data')) {
    hostCooldowns.set('free-api-live-football-data-cheaper-version.p.rapidapi.com', expiresAt);
    hostCooldowns.set('free-api-live-football-data.p.rapidapi.com', expiresAt);
  }
  if (persist) {
    persistHostCooldowns();
  }
}

/**
 * Return all currently active host cooldowns with their expiration timestamps.
 */
export function getActiveHostCooldowns(): Array<{ host: string; expiresAt: number; remainingSeconds: number }> {
  const now = Date.now();
  const active: Array<{ host: string; expiresAt: number; remainingSeconds: number }> = [];
  for (const [host, exp] of hostCooldowns.entries()) {
    if (exp > now) {
      active.push({
        host,
        expiresAt: exp,
        remainingSeconds: Math.max(0, Math.round((exp - now) / 1000)),
      });
    } else {
      hostCooldowns.delete(host);
    }
  }
  return active;
}

/**
 * Clear cooldown for a specific host or all hosts if none specified.
 */
export function clearHostCooldown(host?: string): void {
  if (host) {
    hostCooldowns.delete(host.toLowerCase().trim());
  } else {
    hostCooldowns.clear();
  }
  persistHostCooldowns();
}

/**
 * Return current in-memory football cache statistics for admin monitoring.
 */
export function getFootballCacheStats(): { activeEntries: number; keys: string[] } {
  const now = Date.now();
  const validKeys: string[] = [];
  for (const [key, record] of memoryCache.entries()) {
    if (now < record.expiresAt) {
      validKeys.push(key);
    }
  }
  return {
    activeEntries: validKeys.length,
    keys: validKeys,
  };
}

function isCacheablePayload(data: unknown): boolean {
  if (data === undefined || data === null) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (obj.offline === true || obj.success === false) return false;
    if (Array.isArray(obj.matches)) return obj.matches.length > 0;
    if (Array.isArray(obj.fixtures)) return obj.fixtures.length > 0;
    if (Array.isArray(obj.standings)) return obj.standings.length > 0;
    if (Array.isArray(obj.results)) return obj.results.length > 0;
    if (Array.isArray(obj.data)) return obj.data.length > 0;
  }
  return true;
}

/**
 * Retrieve cached data from in-memory or sessionStorage.
 */
export function getFootballCache<T>(key: string): T | null {
  const now = Date.now();

  // 1. Check in-memory Map
  const mem = memoryCache.get(key) as CacheRecord<T> | undefined;
  if (mem) {
    if (now < mem.expiresAt && isCacheablePayload(mem.data)) {
      return mem.data;
    }
    memoryCache.delete(key);
  }

  // 2. Check SessionStorage
  try {
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem(`${SESSION_PREFIX}${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheRecord<T>;
        if (
          parsed &&
          typeof parsed.expiresAt === 'number' &&
          now < parsed.expiresAt &&
          isCacheablePayload(parsed.data)
        ) {
          // Restore back to memory cache
          memoryCache.set(key, parsed as CacheRecord<unknown>);
          return parsed.data;
        } else {
          sessionStorage.removeItem(`${SESSION_PREFIX}${key}`);
        }
      }
    }
  } catch {
    // Storage access error or quota exceeded
  }

  return null;
}

/**
 * Store data into in-memory and sessionStorage cache with TTL.
 */
export function setFootballCache<T>(key: string, data: T, ttlMs = CACHE_TTLS.UPCOMING_FIXTURES): void {
  if (!isCacheablePayload(data)) return;
  const now = Date.now();
  const record: CacheRecord<T> = {
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  };

  // Enforce memory bounds to prevent memory bloat over prolonged sessions
  if (memoryCache.size >= 150) {
    for (const [k, rec] of memoryCache.entries()) {
      if (now >= rec.expiresAt) {
        memoryCache.delete(k);
      }
    }
    if (memoryCache.size >= 150) {
      // Evict oldest entries
      let evicted = 0;
      for (const k of memoryCache.keys()) {
        memoryCache.delete(k);
        if (++evicted >= 30) break;
      }
    }
  }

  memoryCache.set(key, record as CacheRecord<unknown>);

  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`${SESSION_PREFIX}${key}`, JSON.stringify(record));
    }
  } catch {
    // Storage quota fallback
  }
}

/**
 * In-flight promise coalescing / request deduplication.
 * Ensures identical parallel calls share a single executing Promise.
 */
export async function coalesceRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {
    try {
      return await fn();
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise as Promise<unknown>);
  return promise;
}

/**
 * High-level helper: Fetches with cache check, TTL expiry, and request deduplication.
 */
export async function fetchWithCacheAndDeduplication<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = getFootballCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  return coalesceRequest<T>(key, async () => {
    // Double check cache in case a parallel coalesced call just populated it
    const doubleCheck = getFootballCache<T>(key);
    if (doubleCheck !== null) {
      return doubleCheck;
    }

    const fresh = await fetcher();
    if (isCacheablePayload(fresh)) {
      setFootballCache<T>(key, fresh, ttlMs);
    }
    return fresh;
  });
}

const hostActiveCounts = new Map<string, number>();
const hostWaitQueues = new Map<string, Array<() => void>>();
const urlJsonCache = new Map<string, { expiresAt: number; status: number; bodyText: string }>();
const urlInFlightText = new Map<string, Promise<{ status: number; bodyText: string } | null>>();

const MAX_CONCURRENT_PER_HOST = 2;

async function acquireHostSlot(hostname: string): Promise<void> {
  if (!hostname) return;
  const current = hostActiveCounts.get(hostname) || 0;
  if (current < MAX_CONCURRENT_PER_HOST) {
    hostActiveCounts.set(hostname, current + 1);
    return;
  }
  await new Promise<void>((resolve) => {
    const q = hostWaitQueues.get(hostname) || [];
    q.push(resolve);
    hostWaitQueues.set(hostname, q);
  });
}

function releaseHostSlot(hostname: string): void {
  if (!hostname) return;
  const q = hostWaitQueues.get(hostname);
  if (q && q.length > 0) {
    const next = q.shift()!;
    next();
    return;
  }
  const current = hostActiveCounts.get(hostname) || 1;
  if (current <= 1) {
    hostActiveCounts.delete(hostname);
  } else {
    hostActiveCounts.set(hostname, current - 1);
  }
}

/**
 * Safe fetch wrapper that respects host cooldowns, throttles concurrent HTTP/2 streams
 * per host (preventing net::ERR_HTTP2_PROTOCOL_ERROR), deduplicates identical GET URLs,
 * and activates circuit-breaker cooldowns automatically on 429/403 or network/protocol errors.
 */
export async function safeFootballFetch(
  url: string,
  options?: RequestInit,
  customHost?: string
): Promise<Response | null> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return null;
    }

    let hostname = customHost;
    if (!hostname) {
      try {
        hostname = new URL(url).hostname;
      } catch {
        hostname = '';
      }
    }

    if (hostname && isHostInCooldown(hostname)) {
      return null;
    }

    const isGet = !options?.method || options.method.toUpperCase() === 'GET';
    if (isGet) {
      const now = Date.now();
      const cached = urlJsonCache.get(url);
      if (cached && now < cached.expiresAt) {
        return new Response(cached.bodyText, {
          status: cached.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const existingInFlight = urlInFlightText.get(url);
      if (existingInFlight) {
        const shared = await existingInFlight;
        if (!shared) return null;
        return new Response(shared.bodyText, {
          status: shared.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const executeRequest = async (): Promise<{ status: number; bodyText: string } | null> => {
      await acquireHostSlot(hostname || '');
      try {
        if (hostname && isHostInCooldown(hostname)) {
          return null;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4200);
        try {
          const res = await fetch(url, {
            ...options,
            signal: options?.signal || controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.status === 429) {
            if (hostname) setHostCooldown(hostname, 300_000);
            return null;
          }

          if (res.status === 403 || res.status === 401) {
            if (hostname) setHostCooldown(hostname, 600_000);
            return null;
          }

          if (!res.ok) {
            return null;
          }

          const bodyText = await res.text();
          if (isGet && bodyText) {
            urlJsonCache.set(url, {
              expiresAt: Date.now() + 25_000,
              status: res.status,
              bodyText,
            });
          }
          return { status: res.status, bodyText };
        } catch (err: any) {
          clearTimeout(timeoutId);
          // Only apply a brief in-memory cooldown for non-abort network errors
          if (hostname && err?.name !== 'AbortError') {
            setHostCooldown(hostname, 15_000, false);
          }
          return null;
        }
      } finally {
        releaseHostSlot(hostname || '');
      }
    };

    if (isGet) {
      const p = executeRequest().finally(() => {
        urlInFlightText.delete(url);
      });
      urlInFlightText.set(url, p);
      const result = await p;
      if (!result) return null;
      return new Response(result.bodyText, {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const directResult = await executeRequest();
    if (!directResult) return null;
    return new Response(directResult.bodyText, {
      status: directResult.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return null;
  }
}

