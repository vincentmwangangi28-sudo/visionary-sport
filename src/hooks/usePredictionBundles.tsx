import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PredictionBundle {
  id: string;
  name: string;
  predictionsCount: number;
  priceKes: number;
  discountPercent: number;
}

export const usePredictionBundles = () => {
  const [bundles, setBundles] = useState<PredictionBundle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('prediction_bundles')
        .select('*')
        .eq('is_active', true)
        .order('price_kes', { ascending: true });

      if (error) {
        console.error('Error fetching bundles:', error);
        return;
      }

      setBundles(
        (data || []).map((b) => ({
          id: b.id,
          name: b.name,
          predictionsCount: b.predictions_count,
          priceKes: b.price_kes,
          discountPercent: b.discount_percent || 0,
        }))
      );
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  return { bundles, loading, refetch: fetchBundles };
};
