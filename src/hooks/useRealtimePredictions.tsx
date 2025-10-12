import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Prediction } from './usePredictions';

export const useRealtimePredictions = (
  onNewPrediction: (prediction: Prediction) => void,
  onUpdatePrediction: (prediction: Prediction) => void
) => {
  useEffect(() => {
    const channel = supabase
      .channel('predictions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'predictions'
        },
        (payload) => {
          console.log('🎯 New prediction received:', payload);
          onNewPrediction(payload.new as Prediction);
          toast.success('🔥 New AI prediction available!', {
            description: `${payload.new.home_team} vs ${payload.new.away_team}`,
            duration: 4000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'predictions'
        },
        (payload) => {
          console.log('📊 Prediction updated:', payload);
          onUpdatePrediction(payload.new as Prediction);
          toast.info('Prediction updated', {
            description: `${payload.new.home_team} vs ${payload.new.away_team}`,
            duration: 3000,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time predictions connected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewPrediction, onUpdatePrediction]);
};
