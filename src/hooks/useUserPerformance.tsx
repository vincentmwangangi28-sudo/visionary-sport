import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPerformance {
  total_predictions: number;
  correct_predictions: number;
  average_confidence: number;
  win_rate: number;
}

export const useUserPerformance = () => {
  const [performance, setPerformance] = useState<UserPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-user-performance');
      
      if (error) {
        console.error('Error fetching user performance:', error);
        return;
      }

      setPerformance(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return { performance, loading, refetch: fetchPerformance };
};
