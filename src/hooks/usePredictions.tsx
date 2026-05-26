import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useRealtimePredictions } from './useRealtimePredictions';
import { useSubscription } from './useSubscription';

export interface Prediction {
  id: string; match_id: string; home_team: string; away_team: string;
  league: string; match_date: string; prediction: string; confidence: number;
  reasoning: string; is_premium: boolean; created_at: string;
  result: string | null; ai_model: string;
}

const PAGE_SIZE = 10;

const fetchPredictions = async (page: number, isPremium: boolean): Promise<Prediction[]> => {
  const from = page * PAGE_SIZE;
  let query = supabase.from('predictions').select('*').order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
  // Free users only see non-premium predictions
  if (!isPremium) query = query.eq('is_premium', false);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

export const usePredictions = () => {
  const [page, setPage] = useState(0);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const queryClient = useQueryClient();
  const { subscription } = useSubscription();
  const isPremium = !!subscription;

  const { data: predictions = [], isLoading: loading } = useQuery({
    queryKey: [...queryKeys.predictions.list(page), isPremium],
    queryFn: () => fetchPredictions(page, isPremium),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: [...queryKeys.predictions.list(page + 1), isPremium], queryFn: () => fetchPredictions(page + 1, isPremium) });
  }, [page, isPremium, queryClient]);

  const handleNewPrediction = useCallback((prediction: Prediction) => {
    if (prediction.is_premium && !isPremium) return; // Don't show premium to free users
    queryClient.setQueryData<Prediction[]>([...queryKeys.predictions.list(0), isPremium], (old = []) => {
      if (old.some((p) => p.id === prediction.id)) return old;
      setUpdateCount((c) => c + 1);
      return [prediction, ...old.slice(0, PAGE_SIZE - 1)];
    });
  }, [queryClient, isPremium]);

  const handleUpdatePrediction = useCallback((prediction: Prediction) => {
    queryClient.setQueryData<Prediction[]>([...queryKeys.predictions.list(page), isPremium], (old = []) =>
      old.map((p) => (p.id === prediction.id ? prediction : p))
    );
    setUpdateCount((c) => c + 1);
  }, [queryClient, page, isPremium]);

  useEffect(() => {
    const channel = supabase.channel('predictions-status-check');
    channel.subscribe((status) => setRealtimeConnected(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, []);

  useRealtimePredictions(handleNewPrediction, handleUpdatePrediction);

  const generatePrediction = async (matchData: { homeTeam: string; awayTeam: string; league: string; matchDate: string; isPremium?: boolean }) => {
    const { data, error } = await supabase.functions.invoke('generate-prediction', { body: { matchData } });
    if (error) throw error;
    if (data?.prediction) handleNewPrediction(data.prediction as Prediction);
    return data;
  };

  return {
    predictions, loading, isPremium, generatePrediction,
    refreshPredictions: () => queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all }),
    realtimeConnected, updateCount,
    page, nextPage: () => setPage((p) => p + 1), prevPage: () => setPage((p) => Math.max(0, p - 1)), pageSize: PAGE_SIZE,
  };
};
