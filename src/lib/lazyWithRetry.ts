import { lazy, ComponentType } from 'react';

/**
 * Enhanced React.lazy wrapper that automatically retries chunk loading up to 2 times
 * before falling back to a clean page reload if a build hash has been rotated.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        return await factory();
      } catch (error: any) {
        attempts++;
        if (attempts < maxAttempts) {
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 800));
          continue;
        }

        console.warn('[lazyWithRetry] Dynamic chunk import failed after retries:', error);
        
        const pageHasBeenForceRefreshed = sessionStorage.getItem('chunk_load_retried') === 'true';
        if (!pageHasBeenForceRefreshed && typeof window !== 'undefined') {
          sessionStorage.setItem('chunk_load_retried', 'true');
          window.location.reload();
          return new Promise(() => {}); // prevent further error propagation while page reloads
        }

        sessionStorage.removeItem('chunk_load_retried');
        throw error;
      }
    }

    return await factory();
  });
}
