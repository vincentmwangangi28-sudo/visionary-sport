import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useNotifications = () => {
  useEffect(() => {
    // Subscribe to new predictions
    const predictionsChannel = supabase
      .channel('new-predictions-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'predictions'
        },
        (payload) => {
          const prediction = payload.new;
          if (prediction.confidence >= 75) {
            toast.success('🔥 High Confidence Prediction!', {
              description: `${prediction.home_team} vs ${prediction.away_team} - ${prediction.confidence}% confidence`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(predictionsChannel);
    };
  }, []);
};
