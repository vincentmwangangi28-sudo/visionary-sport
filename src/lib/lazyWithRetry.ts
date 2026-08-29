import { lazy, ComponentType } from 'react';

/**
 * Enhanced React.lazy wrapper that automatically retries and handles chunk fetch failures
 * when a user's browser has outdated chunk hashes after a production deployment.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = sessionStorage.getItem('chunk_load_retried') === 'true';

    try {
      return await factory();
    } catch (error: any) {
      console.warn('[lazyWithRetry] Dynamic import failed, checking reload policy:', error);
      
      // If we haven't refreshed yet, do a single window reload to get fresh index HTML and chunk hashes
      if (!pageHasBeenForceRefreshed && typeof window !== 'undefined') {
        sessionStorage.setItem('chunk_load_retried', 'true');
        window.location.reload();
        return new Promise(() => {}); // prevent further uncaught throws while reloading
      }

      // Reset the session key on persistent failure so future navigations can retry
      sessionStorage.removeItem('chunk_load_retried');
      throw error;
    }
  });
}
