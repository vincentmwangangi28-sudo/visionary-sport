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

const LAST_SYNC_KEY = 'predictpro_last_offline_sync_v6';
const CACHE_IMAGES_NAME = 'predictpro-images-v6';
const CACHE_DATA_NAME = 'predictpro-data-v6';

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
