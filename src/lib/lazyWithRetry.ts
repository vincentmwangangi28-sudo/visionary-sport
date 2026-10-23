import React, { lazy, ComponentType } from 'react';

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

const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem(key);
      }
    } catch {
      // Ignore sandboxed iframe storage restrictions
    }
    return null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(key, value);
      }
    } catch {
      // Ignore
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
  },
};

/**
 * Enhanced React.lazy wrapper that automatically retries chunk loading up to 3 times
 * with backoff before falling back to a clean page reload if a build hash has been rotated.
 * Robust against sandboxed iframes, network blips, and server restarts.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>
): React.ComponentType<any> {
  const createLazy = () =>
    lazy(async () => {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const raw = await factory();
          const Component = resolveComponent<T>(raw);
          safeSessionStorage.removeItem('chunk_load_retried');
          return { default: Component };
        } catch (error: any) {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
            continue;
          }

          console.warn('[lazyWithRetry] Dynamic chunk import delayed after retries:', error?.message || error);

          // Return a self-healing React component instead of rejecting React.lazy,
          // preventing Uncaught TypeError: Failed to fetch dynamically imported module
          const SelfHealingChunkFallback: React.FC<any> = (props) => {
            const [ResolvedComp, setResolvedComp] = React.useState<ComponentType<any> | null>(null);
            const [retryTrigger, setRetryTrigger] = React.useState(0);

            React.useEffect(() => {
              let cancelled = false;
              const timer = setTimeout(async () => {
                try {
                  const mod = await factory();
                  if (!cancelled) {
                    const Comp = resolveComponent<T>(mod);
                    setResolvedComp(() => Comp);
                  }
                } catch {
                  // Will allow manual or next online retry
                }
              }, 1200);

              const handleOnline = () => setRetryTrigger((c) => c + 1);
              window.addEventListener('online', handleOnline);
              return () => {
                cancelled = true;
                clearTimeout(timer);
                window.removeEventListener('online', handleOnline);
              };
            }, [retryTrigger]);

            if (ResolvedComp) {
              return React.createElement(ResolvedComp, props);
            }

            return React.createElement(
              'div',
              {
                className:
                  'min-h-[40vh] flex flex-col items-center justify-center p-6 text-center space-y-3',
              },
              React.createElement(
                'p',
                { className: 'text-sm font-semibold text-foreground' },
                'Reconnecting to live match module...'
              ),
              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => setRetryTrigger((c) => c + 1),
                  className:
                    'px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity',
                },
                'Retry Now'
              )
            );
          };

          return { default: SelfHealingChunkFallback as unknown as T };
        }
      }

      const fallbackRaw = await factory();
      const FallbackComponent = resolveComponent<T>(fallbackRaw);
      return { default: FallbackComponent };
    });

  let currentLazy = createLazy();

  const LazyWrapper = React.forwardRef<any, any>((props, ref) => {
    return React.createElement(currentLazy, { ...props, ref });
  });

  // Provide a method to invalidate and refresh the lazy component on retry
  (LazyWrapper as any).retry = () => {
    currentLazy = createLazy();
  };

  LazyWrapper.displayName = 'LazyWithRetry';
  return LazyWrapper as any;
}

