/**
 * Offline Sync Service & Service Worker Pre-caching Manager.
 * Orchestrates pre-caching of critical football match data, AI predictions,
 * and high-resolution team logos to ensure 100% offline availability for intermittent connections.
 */

import { CANONICAL_TEAM_LOGOS } from '@/services/teamLogos';
import { getSavedPredictionsList } from '@/services/predictionStorage';
import { DEFAULT_PREDICTIONS } from '@/data/mockPredictions';

export interface CacheStats {
  isSupported: boolean;
  isRegistered: boolean;
  cachedLogosCount: number;
  cachedDataAvailable: boolean;
  lastSyncedAt: string | null;
}

export interface CacheStorageBreakdown {
  isSupported: boolean;
  staticCount: number;
  imagesCount: number;
  dataCount: number;
  staleCaches: string[];
  staleEntriesCount: number;
  totalEntriesCount: number;
  usageBytes: number;
  quotaBytes: number;
  formattedUsage: string;
  formattedQuota: string;
  usagePercentage: number;
  lastSyncedAt: string | null;
}

const LAST_SYNC_KEY = 'predictpro_last_offline_sync_v6';
const CACHE_STATIC_NAME = 'predictpro-static-v6';
const CACHE_IMAGES_NAME = 'predictpro-images-v6';
const CACHE_DATA_NAME = 'predictpro-data-v6';
const CURRENT_ACTIVE_CACHES = [CACHE_STATIC_NAME, CACHE_IMAGES_NAME, CACHE_DATA_NAME];

/**
 * Format bytes to readable string (e.g. 14.2 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm))} ${sizes[safeIndex]}`;
}

/**
 * Collects all unique canonical team logo URLs across clubs and national teams.
 */
export function getAllTeamLogoUrls(): string[] {
  const urls = new Set<string>();
  for (const info of Object.values(CANONICAL_TEAM_LOGOS)) {
    if (info.logo && info.logo.startsWith('http')) {
      urls.add(info.logo);
    }
  }
  return Array.from(urls);
}

/**
 * Sends a message to the active Service Worker with fallback safety.
 */
export function sendSWMessage(message: Record<string, unknown>): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
    return true;
  }
  return false;
}

/**
 * Proactively pre-warms the Service Worker Image & Data caches with
 * all canonical team crests and active match predictions.
 */
export async function prewarmOfflineCaches(): Promise<void> {
  if (typeof window === 'undefined') return;

  const logoUrls = getAllTeamLogoUrls();
  const savedMatches = getSavedPredictionsList();
  const matchPayload = savedMatches.length > 0 ? savedMatches : DEFAULT_PREDICTIONS;

  // 1. Direct postMessage to Service Worker if active
  sendSWMessage({
    type: 'PRECACHE_LOGOS',
    urls: logoUrls,
  });

  sendSWMessage({
    type: 'PRECACHE_MATCH_DATA',
    payload: {
      timestamp: new Date().toISOString(),
      matches: matchPayload,
    },
  });

  // 2. Direct browser Cache API pre-caching fallback (if SW controller isn't active yet)
  if ('caches' in window) {
    try {
      const imgCache = await caches.open(CACHE_IMAGES_NAME);
      // Pre-cache top 30 critical league logos immediately in batches
      const priorityLogos = logoUrls.slice(0, 35);
      
      await Promise.allSettled(
        priorityLogos.map(async url => {
          try {
            const hasMatch = await imgCache.match(url);
            if (!hasMatch) {
              const res = await fetch(url, { mode: 'no-cors' });
              if (res) {
                await imgCache.put(url, res);
              }
            }
          } catch {
            // non-blocking
          }
        })
      );

      // Save match snapshot to Cache Storage
      const dataCache = await caches.open(CACHE_DATA_NAME);
      const snapshotUrl = new URL('/api/offline-matches-snapshot', window.location.origin).href;
      const snapshotResponse = new Response(JSON.stringify(matchPayload), {
        headers: { 'Content-Type': 'application/json' },
      });
      await dataCache.put(snapshotUrl, snapshotResponse);

      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (err) {
      console.warn('[OfflineSync] CacheStorage pre-warm warning:', err);
    }
  }
}

/**
 * Retrieves the last time offline match caches were synced
 */
export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

/**
 * Check if the browser currently has offline match data cached
 */
export async function checkOfflineCachesReady(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }
  try {
    const dataCache = await caches.open(CACHE_DATA_NAME);
    const snapshotUrl = new URL('/api/offline-matches-snapshot', window.location.origin).href;
    const match = await dataCache.match(snapshotUrl);
    if (match) return true;

    const imgCache = await caches.open(CACHE_IMAGES_NAME);
    const keys = await imgCache.keys();
    return keys.length > 5;
  } catch {
    return false;
  }
}

/**
 * Retrieves comprehensive breakdown of all offline caches, entries count,
 * and estimated disk storage used.
 */
export async function getCacheStorageBreakdown(): Promise<CacheStorageBreakdown> {
  const fallback: CacheStorageBreakdown = {
    isSupported: typeof window !== 'undefined' && 'caches' in window,
    staticCount: 0,
    imagesCount: 0,
    dataCount: 0,
    staleCaches: [],
    staleEntriesCount: 0,
    totalEntriesCount: 0,
    usageBytes: 0,
    quotaBytes: 0,
    formattedUsage: '0 B',
    formattedQuota: 'Unlimited',
    usagePercentage: 0,
    lastSyncedAt: getLastSyncTime(),
  };

  if (typeof window === 'undefined' || !('caches' in window)) {
    return fallback;
  }

  try {
    let usageBytes = 0;
    let quotaBytes = 0;
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    }

    const allKeys = await caches.keys();
    const staleCaches = allKeys.filter(key => !CURRENT_ACTIVE_CACHES.includes(key));

    let staticCount = 0;
    let imagesCount = 0;
    let dataCount = 0;
    let staleEntriesCount = 0;

    if (allKeys.includes(CACHE_STATIC_NAME)) {
      const c = await caches.open(CACHE_STATIC_NAME);
      const k = await c.keys();
      staticCount = k.length;
    }

    if (allKeys.includes(CACHE_IMAGES_NAME)) {
      const c = await caches.open(CACHE_IMAGES_NAME);
      const k = await c.keys();
      imagesCount = k.length;
    }

    if (allKeys.includes(CACHE_DATA_NAME)) {
      const c = await caches.open(CACHE_DATA_NAME);
      const k = await c.keys();
      dataCount = k.length;
    }

    for (const staleKey of staleCaches) {
      try {
        const c = await caches.open(staleKey);
        const k = await c.keys();
        staleEntriesCount += k.length;
      } catch {
        // ignore legacy cache read error
      }
    }

    const totalEntriesCount = staticCount + imagesCount + dataCount + staleEntriesCount;
    const usagePercentage =
      quotaBytes > 0 ? Math.min(100, Math.round((usageBytes / quotaBytes) * 10000) / 100) : 0;

    return {
      isSupported: true,
      staticCount,
      imagesCount,
      dataCount,
      staleCaches,
      staleEntriesCount,
      totalEntriesCount,
      usageBytes,
      quotaBytes,
      formattedUsage: formatBytes(usageBytes),
      formattedQuota: formatBytes(quotaBytes),
      usagePercentage,
      lastSyncedAt: getLastSyncTime(),
    };
  } catch (err) {
    console.warn('[OfflineSync] Error reading cache breakdown:', err);
    return fallback;
  }
}

/**
 * Clears stale, orphaned, and obsolete cache stores and trims excess bloated assets,
 * maximizing device storage efficiency without breaking offline capabilities.
 */
export async function clearStaleCaches(): Promise<{
  freedCachesCount: number;
  freedEntriesCount: number;
  message: string;
}> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { freedCachesCount: 0, freedEntriesCount: 0, message: 'Cache API not supported' };
  }

  try {
    // 1. Notify Service Worker first
    sendSWMessage({ type: 'CLEAR_STALE_CACHE' });

    const allKeys = await caches.keys();
    const staleKeys = allKeys.filter(key => !CURRENT_ACTIVE_CACHES.includes(key));
    let freedCachesCount = 0;
    let freedEntriesCount = 0;

    // 2. Direct browser cleanup of all non-active stale caches
    for (const staleKey of staleKeys) {
      try {
        const c = await caches.open(staleKey);
        const k = await c.keys();
        freedEntriesCount += k.length;
        const deleted = await caches.delete(staleKey);
        if (deleted) freedCachesCount++;
      } catch {
        await caches.delete(staleKey);
      }
    }

    // 3. Prune excessive cached image assets (keep most recent 60)
    if (allKeys.includes(CACHE_IMAGES_NAME)) {
      try {
        const imgCache = await caches.open(CACHE_IMAGES_NAME);
        const imgKeys = await imgCache.keys();
        if (imgKeys.length > 70) {
          const toRemove = imgKeys.slice(0, imgKeys.length - 70);
          for (const k of toRemove) {
            await imgCache.delete(k);
            freedEntriesCount++;
          }
        }
      } catch {
        // ignore
      }
    }

    // 4. Clean obsolete snapshots from data cache if older than 48h
    if (allKeys.includes(CACHE_DATA_NAME)) {
      try {
        const dataCache = await caches.open(CACHE_DATA_NAME);
        const snapshotUrl = new URL('/api/offline-matches-snapshot', window.location.origin).href;
        const match = await dataCache.match(snapshotUrl);
        if (match) {
          const payload = await match.json().catch(() => null);
          if (payload?.timestamp) {
            const age = Date.now() - new Date(payload.timestamp).getTime();
            if (age > 48 * 60 * 60 * 1000) {
              await dataCache.delete(snapshotUrl);
              freedEntriesCount++;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    return {
      freedCachesCount,
      freedEntriesCount,
      message: `Cleaned ${freedEntriesCount} stale assets across ${freedCachesCount} legacy cache stores`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to clear';
    console.warn('[OfflineSync] Error clearing stale cache:', err);
    return { freedCachesCount: 0, freedEntriesCount: 0, message: errorMsg };
  }
}

/**
 * Selectively clears a targeted cache category or flushes entire offline storage
 */
export async function clearCacheCategory(category: 'images' | 'data' | 'stale' | 'all'): Promise<{
  success: boolean;
  freedCount: number;
  message: string;
}> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { success: false, freedCount: 0, message: 'Caches not supported' };
  }

  try {
    sendSWMessage({ type: 'CLEAR_CACHE_CATEGORY', category });

    let freedCount = 0;
    if (category === 'images') {
      const c = await caches.open(CACHE_IMAGES_NAME);
      const k = await c.keys();
      freedCount = k.length;
      await caches.delete(CACHE_IMAGES_NAME);
      await caches.open(CACHE_IMAGES_NAME);
    } else if (category === 'data') {
      const c = await caches.open(CACHE_DATA_NAME);
      const k = await c.keys();
      freedCount = k.length;
      await caches.delete(CACHE_DATA_NAME);
      await caches.open(CACHE_DATA_NAME);
      localStorage.removeItem(LAST_SYNC_KEY);
    } else if (category === 'stale') {
      const res = await clearStaleCaches();
      return { success: true, freedCount: res.freedEntriesCount, message: res.message };
    } else if (category === 'all') {
      const allKeys = await caches.keys();
      for (const k of allKeys) {
        const c = await caches.open(k);
        const entries = await c.keys();
        freedCount += entries.length;
        await caches.delete(k);
      }
      localStorage.removeItem(LAST_SYNC_KEY);
      // Re-populate essential shell
      const staticCache = await caches.open(CACHE_STATIC_NAME);
      await staticCache.addAll(['/', '/index.html', '/manifest.json', '/favicon.ico']).catch(() => {});
    }

    return {
      success: true,
      freedCount,
      message: `Cleared ${freedCount} entries from ${category} cache`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed';
    return { success: false, freedCount: 0, message: errorMsg };
  }
}

// Auto-trigger pre-warming on idle/startup
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Stagger slightly after initial paint
    setTimeout(() => {
      if (navigator.onLine) {
        prewarmOfflineCaches();
      }
    }, 2500);
  });

  window.addEventListener('online', () => {
    prewarmOfflineCaches();
  });
}
