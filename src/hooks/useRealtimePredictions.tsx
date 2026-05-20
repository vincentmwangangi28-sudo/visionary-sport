import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Prediction } from './usePredictions';

// Singleton channel — shared by all consumers to avoid duplicate subscriptions
let sharedChannel: ReturnType<typeof supabase.channel> | null = null;
let subscribers = 0;

export const useRealtimePredictions = (
  onNewPrediction: (prediction: Prediction) => void,
  onUpdatePrediction: (prediction: Prediction) => void
) => {
  useEffect(() => {
    subscribers++;

    if (!sharedChannel) {
      sharedChannel = supabase
        .channel('predictions-realtime-shared')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'predictions' }, (payload) => {
          onNewPrediction(payload.new as Prediction);
          toast.success('🔥 New AI prediction available!', {
            description: `${payload.new.home_team} vs ${payload.new.away_team}`,
            duration: 4000,
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'predictions' }, (payload) => {
          onUpdatePrediction(payload.new as Prediction);
        })
        .subscribe();
    }

    return () => {
      subscribers--;
      if (subscribers === 0 && sharedChannel) {
        supabase.removeChannel(sharedChannel);
        sharedChannel = null;
      }
    };
  }, [onNewPrediction, onUpdatePrediction]);
};
