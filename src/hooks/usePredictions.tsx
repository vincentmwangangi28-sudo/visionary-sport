import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { Prediction, getPrediction, getConfidence } from '@/types/prediction';

export type { Prediction };
export { getPrediction, getConfidence };

const PAGE_SIZE = 9;
const queryKeys = { predictions: { list: (p: number) => ['predictions', 'list', p] } };

export const usePredictions = (page = 1, league?: string) => {
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.predictions.list(page), league ?? 'all'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      let q = supabase
        .from('predictions')
        .select('*', { count: 'exact' })
        .gte('match_date', today)
        .lte('match_date', twoWeeks)
        .order('confidence', { ascending: false })
        .order('match_date', { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (league) q = q.eq('league', league);
      const { data, error, count } = await q;
      if (error) throw error;
      return { predictions: (data ?? []) as Prediction[], total: count ?? 0 };
    },
    staleTime: 120_000,
    retry: 3,
  });

  // Gate premium for free users
  const gated = (query.data?.predictions ?? []).map(p => {
    const outcome = getPrediction(p);
    if (p.is_premium && !isPremium() && !outcome.includes('🔒')) {
      return {
        ...p,
        prediction: '🔒 Premium', predicted_outcome: '🔒 Premium',
        analysis: 'Upgrade to Pro to unlock this premium prediction.',
        reasoning: '', confidence: 0, confidence_score: 0,
        home_odds: undefined, draw_odds: undefined, away_odds: undefined,
      };
    }
    return p;
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Prefetch next page
  if (page < totalPages) {
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.predictions.list(page + 1), league ?? 'all'],
      queryFn: async () => {
        const today = new Date().toISOString().split('T')[0];
      const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
        let q = supabase.from('predictions').select('*', { count: 'exact' })
          .gte('match_date', today)
        .lte('match_date', twoWeeks).order('confidence', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (league) q = q.eq('league', league);
        const { data, count } = await q;
        return { predictions: (data ?? []) as Prediction[], total: count ?? 0 };
      },
      staleTime: 120_000,
    });
  }

  return { ...query, predictions: gated, totalPages, pageSize: PAGE_SIZE };
};
