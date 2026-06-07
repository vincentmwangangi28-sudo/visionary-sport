import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimePredictions } from './useRealtimePredictions';

export interface Prediction {
  id: string;
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  is_premium: boolean;
  created_at: string;
  result: string | null;
  ai_model: string;
}

const PREDICTIONS_KEY = ['predictions', 'feed'] as const;

const fetchPredictions = async (): Promise<Prediction[]> => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []) as Prediction[];
};

export const usePredictions = () => {
  const queryClient = useQueryClient();
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);

  const { data: predictions = [], isLoading, refetch } = useQuery({
    queryKey: PREDICTIONS_KEY,
    queryFn: fetchPredictions,
    // SWR-style: instant from cache, refresh in background
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });

  // Merge realtime inserts into the cache without a refetch
  const handleNewPrediction = useCallback((prediction: Prediction) => {
    queryClient.setQueryData<Prediction[]>(PREDICTIONS_KEY, (prev = []) => {
      if (prev.some((p) => p.id === prediction.id)) return prev;
      setUpdateCount((c) => c + 1);
      return [prediction, ...prev].slice(0, 30);
    });
  }, [queryClient]);

  const handleUpdatePrediction = useCallback((prediction: Prediction) => {
    queryClient.setQueryData<Prediction[]>(PREDICTIONS_KEY, (prev = []) =>
      prev.map((p) => (p.id === prediction.id ? prediction : p)),
    );
    setUpdateCount((c) => c + 1);
  }, [queryClient]);

  // Track realtime connection status
  useEffect(() => {
    const channel = supabase.channel('predictions-status-check');
    channel.subscribe((status) => {
      setRealtimeConnected(status === 'SUBSCRIBED');
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useRealtimePredictions(handleNewPrediction, handleUpdatePrediction);

  const generatePrediction = async (matchData: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    matchDate: string;
    isPremium?: boolean;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-prediction', {
        body: { matchData },
      });
      if (error) throw error;

      if (data?.prediction) {
        queryClient.setQueryData<Prediction[]>(PREDICTIONS_KEY, (prev = []) => [
          data.prediction,
          ...prev,
        ]);
      }
      return data;
    } catch (error) {
      console.error('Error generating prediction:', error);
      throw error;
    }
  };

  return {
    predictions,
    loading: isLoading,
    generatePrediction,
    refreshPredictions: refetch,
    realtimeConnected,
    updateCount,
  };
};
