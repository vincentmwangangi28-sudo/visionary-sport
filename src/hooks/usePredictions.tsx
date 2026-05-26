import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useSubscription } from '@/hooks/useSubscription';

export interface Prediction {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  league: string;
  predicted_outcome: string;
  confidence_score: number;
  is_premium: boolean;
  status: string;
  home_odds?: number;
  away_odds?: number;
  draw_odds?: number;
  analysis?: string;
  result?: string;
  created_at: string;
}

const PAGE_SIZE = 10;

export const usePredictions = (page = 1) => {
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.predictions.list(page),
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('predictions')
        .select('*', { count: 'exact' })
        .order('match_date', { ascending: true })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { predictions: data as Prediction[], total: count ?? 0 };
    },
    staleTime: 60_000,
  });

  // Prefetch next page
  if (page < Math.ceil((query.data?.total ?? 0) / PAGE_SIZE)) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.predictions.list(page + 1),
      queryFn: async () => {
        const from = page * PAGE_SIZE;
        const { data, count } = await supabase.from('predictions')
          .select('*', { count: 'exact' }).order('match_date', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);
        return { predictions: data as Prediction[], total: count ?? 0 };
      },
      staleTime: 60_000,
    });
  }

  // Gate premium predictions for non-subscribers
  const gatedPredictions = (query.data?.predictions ?? []).map(p => {
    if (p.is_premium && !isPremium()) {
      return {
        ...p,
        predicted_outcome: '🔒 Premium',
        analysis: 'Upgrade to see this prediction',
        confidence_score: 0,
        home_odds: undefined,
        away_odds: undefined,
        draw_odds: undefined,
      };
    }
    return p;
  });

  const totalPages = Math.ceil((query.data?.total ?? 0) / PAGE_SIZE);
  return { ...query, predictions: gatedPredictions, totalPages, pageSize: PAGE_SIZE };
};
