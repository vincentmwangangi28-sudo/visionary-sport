import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { logger } from './logger';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      try {
        const queryKeyStr = Array.isArray(query.queryKey) ? query.queryKey.join('/') : String(query.queryKey);
        logger.logNetworkError(`query:${queryKeyStr}`, error, {
          queryKey: query.queryKey,
          stateStatus: query.state.status,
        });
      } catch {
        // Safe guard
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      try {
        const mutationKeyStr = mutation.options.mutationKey
          ? (Array.isArray(mutation.options.mutationKey) ? mutation.options.mutationKey.join('/') : String(mutation.options.mutationKey))
          : 'anonymous_mutation';
        logger.logNetworkError(`mutation:${mutationKeyStr}`, error, {
          mutationKey: mutation.options.mutationKey,
        });
      } catch {
        // Safe guard
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Keep data fresh for 2 minutes, cache for 10min
      staleTime: 2 * 60_000,
      gcTime: 10 * 60_000,
      // Retry once on failure, with exponential backoff
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5_000),
      // Prevent CPU and network thrashing on tab focus
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0,
    },
  },
});

// Prefetch helpers
export const prefetchPredictions = () =>
  queryClient.prefetchQuery({
    queryKey: ['predictions', 'list', 1],
    staleTime: 60_000,
  });
