import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { logger } from "./lib/logger";

// Initialize centralized unhandled exception & network rejection monitoring
logger.initGlobalErrorLogging();

if ('serviceWorker' in navigator) {
  let lastRevalidationTime = 0;
  const handleMatchDataRevalidation = (data?: { url?: string; timestamp?: string }) => {
    const now = Date.now();
    if (now - lastRevalidationTime < 30000) return;
    lastRevalidationTime = now;

    try {
      queryClient.invalidateQueries({ queryKey: ['predictions'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['live-fixtures'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['upcoming-fixtures'] }).catch(() => {});

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

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'MATCH_DATA_REVALIDATED') {
      handleMatchDataRevalidation(event.data);
    }
  });

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

  if ('caches' in window) {
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith('predictpro-v4'))
            .map((k) => caches.delete(k).catch(() => false))
        )
      )
      .catch(() => {});
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async (reg) => {
        reg.update().catch(() => {});

        const notifySWOfSWR = () => {
          if (reg.active) {
            reg.active.postMessage({
              type: 'ENABLE_MATCH_SWR',
              strategy: 'stale-while-revalidate',
            });
          }
        };

        notifySWOfSWR();

        const { prewarmOfflineCaches, triggerMatchDataRevalidation } = await import('./services/offlineSyncService');

        if (navigator.onLine) {
          prewarmOfflineCaches().catch(() => {});
        }

        window.addEventListener('online', () => {
          triggerMatchDataRevalidation().catch(() => {});
          prewarmOfflineCaches().catch(() => {});
        });

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            triggerMatchDataRevalidation().catch(() => {});
          }
        });

        setInterval(() => {
          if (navigator.onLine && document.visibilityState === 'visible') {
            triggerMatchDataRevalidation().catch(() => {});
          }
        }, 5 * 60 * 1000);

        setInterval(() => {
          reg.update().catch(() => {});
        }, 60 * 60 * 1000);
      })
      .catch((err) => console.warn('SW registration failed:', err));

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ENABLE_MATCH_SWR',
          strategy: 'stale-while-revalidate',
        });
      }
      if (navigator.onLine) {
        import('./services/offlineSyncService')
          .then(({ prewarmOfflineCaches }) => prewarmOfflineCaches())
          .catch(() => {});
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
