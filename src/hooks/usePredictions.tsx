import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useSubscription } from '@/hooks/useSubscription';
import { Prediction, getPrediction, getConfidence } from '@/types/prediction';

export type { Prediction };
export { getPrediction, getConfidence };

const PAGE_SIZE = 10;

export const usePredictions = (page = 1, league?: string) => {
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.predictions.list(page), league],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      let q = supabase
        .from('predictions')
        .select('*', { count: 'exact' })
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (league) q = q.eq('league', league);
      const { data, error, count } = await q;
      if (error) throw error;
      return { predictions: (data ?? []) as Prediction[], total: count ?? 0 };
    },
    staleTime: 60_000,
  });

  // Prefetch next page
  const total = query.data?.total ?? 0;
  if (page < Math.ceil(total / PAGE_SIZE)) {
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.predictions.list(page + 1), league],
      queryFn: async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data, count } = await supabase.from('predictions').select('*', { count: 'exact' })
          .gte('match_date', today).order('match_date', { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        return { predictions: (data ?? []) as Prediction[], total: count ?? 0 };
      },
      staleTime: 60_000,
    });
  }

  // Gate premium predictions for free users
  const gatedPredictions = (query.data?.predictions ?? []).map(p => {
    if (p.is_premium && !isPremium()) {
      return {
        ...p, prediction: '🔒 Premium', predicted_outcome: '🔒 Premium',
        analysis: 'Upgrade to unlock this prediction', reasoning: 'Upgrade to unlock',
        confidence: 0, confidence_score: 0,
        home_odds: undefined, draw_odds: undefined, away_odds: undefined,
      };
    }
    return p;
  });

  return {
    ...query,
    predictions: gatedPredictions,
    totalPages: Math.ceil(total / PAGE_SIZE),
    pageSize: PAGE_SIZE,
  };
};
