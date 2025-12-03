import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price_kes: number;
  bonus_coins: number;
  description: string | null;
  is_popular: boolean;
}

export const useCoinPackages = () => {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('coin_packages')
        .select('*')
        .eq('is_active', true)
        .order('price_kes', { ascending: true });

      if (error) {
        console.error('Error fetching coin packages:', error);
        return;
      }

      setPackages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return { packages, loading, refetch: fetchPackages };
};
