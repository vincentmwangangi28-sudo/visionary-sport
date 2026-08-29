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

const SESSION_PREFIX = 'predictpro_fc_';
const COOLDOWN_STORAGE_KEY = 'predictpro_host_cooldowns';

// Initialize host cooldowns from sessionStorage on startup
try {
  if (typeof window !== 'undefined') {
    const raw = sessionStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const now = Date.now();
      for (const [host, exp] of Object.entries(parsed)) {
        if (typeof exp === 'number' && exp > now) {
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
      sessionStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(obj));
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
 */
export function setHostCooldown(host: string, durationMs = 300_000) {
  if (!host) return;
  const cleanHost = host.toLowerCase().trim();
  const expiresAt = Date.now() + durationMs;
  hostCooldowns.set(cleanHost, expiresAt);
  persistHostCooldowns();
}

/**
 * Retrieve cached data from in-memory or sessionStorage.
 */
export function getFootballCache<T>(key: string): T | null {
  const now = Date.now();

  // 1. Check in-memory Map
  const mem = memoryCache.get(key) as CacheRecord<T> | undefined;
  if (mem) {
    if (now < mem.expiresAt) {
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
        if (parsed && typeof parsed.expiresAt === 'number' && now < parsed.expiresAt) {
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
  if (data === undefined || data === null) return;
  const now = Date.now();
  const record: CacheRecord<T> = {
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  };

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
    if (fresh !== undefined && fresh !== null) {
      // Only cache if array has elements or valid object
      if (!Array.isArray(fresh) || fresh.length > 0) {
        setFootballCache<T>(key, fresh, ttlMs);
      }
    }
    return fresh;
  });
}

/**
 * Safe fetch wrapper that respects host cooldowns, catches 429/403 errors,
 * and activates circuit breaker cooldowns automatically.
 */
export async function safeFootballFetch(
  url: string,
  options?: RequestInit,
  customHost?: string
): Promise<Response | null> {
  try {
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

    const res = await fetch(url, options);

    if (res.status === 429) {
      if (hostname) {
        setHostCooldown(hostname, 300_000); // 5 min cooldown for 429
      }
      return null;
    }

    if (res.status === 403 || res.status === 401) {
      if (hostname) {
        setHostCooldown(hostname, 600_000); // 10 min cooldown for 403/401
      }
      return null;
    }

    return res;
  } catch (err) {
    return null;
  }
}
