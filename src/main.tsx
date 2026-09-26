import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prewarmOfflineCaches, triggerMatchDataRevalidation } from "./services/offlineSyncService";
import { queryClient } from "./lib/queryClient";
import { logger } from "./lib/logger";

// Initialize centralized unhandled exception & network rejection monitoring
logger.initGlobalErrorLogging();

/**
 * Enhanced Service Worker Registration with Stale-While-Revalidate (SWR) for Match Data.
 *
 * SWR Mechanics:
 * 1. Instant Cache Response: Serves cached football match snapshots and predictions immediately
 *    from CacheStorage, allowing full offline browsing and zero-latency loading.
 * 2. Background Revalidation: The Service Worker fetches fresh match results/odds in the background.
 * 3. Cache Refresh & Client Broadcast: Updated match data refreshes CacheStorage and sends a
 *    `MATCH_DATA_REVALIDATED` message to active browser clients.
 * 4. Reactive UI Synchronization: React Query automatically invalidates and refreshes active
 *    queries ('predictions', 'live-fixtures', 'upcoming-fixtures') without page reloading.
 * 5. Reconnection & Visibility Sync: Triggers immediate revalidation on network recovery and tab focus.
 */
if ('serviceWorker' in navigator) {
  // Handler for background revalidation broadcasts
  const handleMatchDataRevalidation = (data?: { url?: string; timestamp?: string }) => {
    try {
      // Invalidate match prediction queries so UI updates smoothly with fresh data
      queryClient.invalidateQueries({ queryKey: ['predictions'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['live-fixtures'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['upcoming-fixtures'] }).catch(() => {});

      // Dispatch custom DOM event for listening components
      window.dispatchEvent(
        new CustomEvent('predictpro:match-data-revalidated', {
          detail: {
            url: data?.url,
            timestamp: data?.timestamp || new Date().toISOString(),
          },
        })
      );
    } catch {
      // Non-blocking
    }
  };

  // Listen for Service Worker postMessage notifications
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'MATCH_DATA_REVALIDATED') {
      handleMatchDataRevalidation(event.data);
    }
  });

  // Support BroadcastChannel for multi-tab SWR updates if supported
  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('predictpro-match-swr');
      channel.onmessage = (event) => {
        if (event.data?.type === 'MATCH_DATA_REVALIDATED') {
          handleMatchDataRevalidation(event.data);
        }
      };
    } catch {
      // BroadcastChannel optional fallback
    }
  }

  // Immediately purge any stale pre-v9 caches so old poisoned chunk entries are evicted
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.includes('v9')).map((k) => caches.delete(k))))
      .catch(() => {});
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        reg.update().catch(() => {});

        // Handshake with active worker: configure Stale-While-Revalidate strategy
        const notifySWOfSWR = () => {
          if (reg.active) {
            reg.active.postMessage({
              type: 'ENABLE_MATCH_SWR',
              strategy: 'stale-while-revalidate',
            });
          }
        };

        notifySWOfSWR();

        // Pre-warm offline match data and team logos into Service Worker caches
        if (navigator.onLine) {
          prewarmOfflineCaches().catch(() => {});
        }

        // On network reconnect, immediately trigger background revalidation of match data
        window.addEventListener('online', () => {
          triggerMatchDataRevalidation().catch(() => {});
          prewarmOfflineCaches().catch(() => {});
        });

        // When user switches back to the tab, revalidate match data if online
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            triggerMatchDataRevalidation().catch(() => {});
          }
        });

        // Periodic background revalidation check every 5 minutes when active
        setInterval(() => {
          if (navigator.onLine && document.visibilityState === 'visible') {
            triggerMatchDataRevalidation().catch(() => {});
          }
        }, 5 * 60 * 1000);

        // Check for updates every hour (safely handle network interruptions in iframe)
        setInterval(() => {
          reg.update().catch(() => {});
        }, 60 * 60 * 1000);
      })
      .catch((err) => console.warn('SW registration failed:', err));

    // Handle controller transitions when updated service worker activates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ENABLE_MATCH_SWR',
          strategy: 'stale-while-revalidate',
        });
      }
      if (navigator.onLine) {
        prewarmOfflineCaches().catch(() => {});
      }
    });
  });
}

// Automatic recovery from stale chunks or MIME type mismatches across new deployments
if (typeof window !== 'undefined') {
  const handleChunkOrMimeError = (msg: string) => {
    if (
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Expected a JavaScript-or-Wasm module script') ||
      msg.includes('MIME type') ||
      msg.includes('Missing Supabase configuration')
    ) {
      const hasReloaded = sessionStorage.getItem('predictpro_chunk_retry');
      if (!hasReloaded) {
        sessionStorage.setItem('predictpro_chunk_retry', 'true');
        if ('caches' in window) {
          caches
            .keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .finally(() => {
              window.location.reload();
            });
        } else {
          window.location.reload();
        }
      }
    }
  };

  window.addEventListener('error', (event) => {
    handleChunkOrMimeError(event.message || '');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg =
      typeof event.reason === 'string'
        ? event.reason
        : event.reason?.message || '';
    handleChunkOrMimeError(reasonMsg);
  });

  // Clear retry flag on fresh successful mount
  setTimeout(() => {
    sessionStorage.removeItem('predictpro_chunk_retry');
  }, 10000);
}

createRoot(document.getElementById("root")!).render(<App />);
