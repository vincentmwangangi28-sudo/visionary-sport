import { useState, useEffect, useCallback } from 'react';
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
}

export const usePredictions = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNewPrediction = useCallback((prediction: Prediction) => {
    setPredictions(prev => [prediction, ...prev.slice(0, 9)]);
  }, []);

  useRealtimePredictions(handleNewPrediction);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async (matchData: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    matchDate: string;
    isPremium?: boolean;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-prediction', {
        body: { matchData }
      });

      if (error) throw error;
      
      if (data?.prediction) {
        setPredictions(prev => [data.prediction, ...prev]);
      }
      
      return data;
    } catch (error) {
      console.error('Error generating prediction:', error);
      throw error;
    }
  };

  return { predictions, loading, generatePrediction, refreshPredictions: loadPredictions };
};
