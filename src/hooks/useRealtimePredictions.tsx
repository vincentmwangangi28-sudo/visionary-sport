import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Prediction } from './usePredictions';

export const useRealtimePredictions = (
  onNewPrediction: (prediction: Prediction) => void
) => {
  useEffect(() => {
    const channel = supabase
      .channel('predictions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'predictions'
        },
        (payload) => {
          console.log('New prediction received:', payload);
          onNewPrediction(payload.new as Prediction);
          toast.success('New AI prediction available!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewPrediction]);
};
