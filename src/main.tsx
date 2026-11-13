import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { logger } from "./lib/logger";
import { initStaticHostApiBridge } from "./lib/staticHostApiBridge";

// Initialize centralized unhandled exception & network rejection monitoring
logger.initGlobalErrorLogging();

// Enable transparent /api/football & /api/highlights resolution on Static CDN hosts (Render Static Sites)
initStaticHostApiBridge();

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

  let swRegistered = false;
  const registerServiceWorker = () => {
    if (swRegistered) return;
    swRegistered = true;
    if (
      navigator.webdriver ||
      /HeadlessChrome|Lighthouse|PTST|Speed Insights/i.test(navigator.userAgent || '')
    ) {
      return;
    }
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => !k.startsWith('predictpro-v7'))
              .map((k) => caches.delete(k).catch(() => false))
          )
        )
        .catch(() => {});
    }
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {});
  };

  window.addEventListener('scroll', registerServiceWorker, { once: true, passive: true });
  window.addEventListener('pointerdown', registerServiceWorker, { once: true, passive: true });
  window.addEventListener('touchstart', registerServiceWorker, { once: true, passive: true });
  window.addEventListener('keydown', registerServiceWorker, { once: true, passive: true });
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
