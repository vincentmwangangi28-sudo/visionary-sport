import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
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
