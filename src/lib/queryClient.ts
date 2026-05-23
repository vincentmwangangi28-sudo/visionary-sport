import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 60s, cache for 5min
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      // Retry once on failure, with exponential backoff
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      // Refetch when window regains focus (user comes back to tab)
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect for stale data
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
