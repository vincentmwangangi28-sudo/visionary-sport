import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useRealtimePredictions } from './useRealtimePredictions';

export interface Prediction {
  id: string; match_id: string; home_team: string; away_team: string;
  league: string; match_date: string; prediction: string; confidence: number;
  reasoning: string; is_premium: boolean; created_at: string;
  result: string | null; ai_model: string;
}
const PAGE_SIZE = 10;
const fetchPredictions = async (page: number): Promise<Prediction[]> => {
  const from = page * PAGE_SIZE;
  const { data, error } = await supabase
    .from('predictions').select('*')
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return data ?? [];
};
export const usePredictions = () => {
  const [page, setPage] = useState(0);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const queryClient = useQueryClient();
  const { data: predictions = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.predictions.list(page),
    queryFn: () => fetchPredictions(page),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: queryKeys.predictions.list(page + 1), queryFn: () => fetchPredictions(page + 1) });
  }, [page, queryClient]);
  const handleNewPrediction = useCallback((prediction: Prediction) => {
    queryClient.setQueryData<Prediction[]>(queryKeys.predictions.list(0), (old = []) => {
      if (old.some((p) => p.id === prediction.id)) return old;
      setUpdateCount((c) => c + 1);
      return [prediction, ...old.slice(0, PAGE_SIZE - 1)];
    });
  }, [queryClient]);
  const handleUpdatePrediction = useCallback((prediction: Prediction) => {
    queryClient.setQueryData<Prediction[]>(queryKeys.predictions.list(page), (old = []) =>
      old.map((p) => (p.id === prediction.id ? prediction : p))
    );
    setUpdateCount((c) => c + 1);
  }, [queryClient, page]);
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
    predictions, loading, generatePrediction,
    refreshPredictions: () => queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all }),
    realtimeConnected, updateCount,
    page, nextPage: () => setPage((p) => p + 1), prevPage: () => setPage((p) => Math.max(0, p - 1)), pageSize: PAGE_SIZE,
  };
};
