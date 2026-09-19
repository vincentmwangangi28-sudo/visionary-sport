import { lazy, ComponentType } from 'react';
import { logger } from './logger';

/**
 * Safely extracts a valid React component from a module object, handling:
 * 1. Standard ESM default exports ({ default: Component })
 * 2. Double-nested defaults from transpiled CJS/ESM interop ({ default: { default: Component } })
 * 3. Direct component functions or forwardRef/memo objects
 * 4. Named exports within the module
 */
function resolveComponent<T extends ComponentType<any>>(mod: any): T {
  if (!mod) {
    throw new Error('Component module resolved to null or undefined');
  }

  // Direct component function or React component object ($$typeof / render)
  if (
    typeof mod === 'function' ||
    (typeof mod === 'object' && mod !== null && ('$$typeof' in mod || 'render' in mod))
  ) {
    return mod;
  }

  if (typeof mod === 'object') {
    let candidate = mod.default;

    // Handle double-nested default
    if (candidate && typeof candidate === 'object' && 'default' in candidate) {
      candidate = candidate.default;
    }

    if (
      typeof candidate === 'function' ||
      (candidate && typeof candidate === 'object' && ('$$typeof' in candidate || 'render' in candidate))
    ) {
      return candidate;
    }

    // Check for named export matching a valid React component
    for (const key of Object.keys(mod)) {
      if (key === 'default' || key === '__esModule') continue;
      const val = mod[key];
      if (
        typeof val === 'function' ||
        (val && typeof val === 'object' && ('$$typeof' in val || 'render' in val))
      ) {
        return val;
      }
    }
  }

  throw new Error(`Lazy element type must resolve to a class or function, but got: ${typeof mod}`);
}

/**
 * Enhanced React.lazy wrapper that automatically retries chunk loading up to 2 times
 * before falling back to a clean page reload if a build hash has been rotated.
 * Robust against any module bundling or interop format.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>
) {
  return lazy(async () => {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        const raw = await factory();
        const Component = resolveComponent<T>(raw);
        return { default: Component };
      } catch (error: any) {
        attempts++;
        if (attempts < maxAttempts) {
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 800));
          continue;
        }

        console.warn('[lazyWithRetry] Dynamic chunk import failed after retries:', error);
        try {
          logger.error(error, {
            errorType: 'chunk_load_error',
            severity: 'error',
            metadata: {
              attemptCount: attempts,
              route: typeof window !== 'undefined' ? window.location.pathname : undefined,
            },
          });
        } catch {
          // Guard logger
        }
        
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

    const fallbackRaw = await factory();
    const FallbackComponent = resolveComponent<T>(fallbackRaw);
    return { default: FallbackComponent };
  });
}
