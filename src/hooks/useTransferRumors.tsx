import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TransferRumor {
  id: string;
  player_name: string;
  current_club: string | null;
  target_club: string | null;
  transfer_fee: string | null;
  probability: number;
  source: string | null;
  headline: string;
  details: string | null;
  is_confirmed: boolean;
  created_at: string;
}

export function useTransferRumors() {
  const [rumors, setRumors] = useState<TransferRumor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRumors = async () => {
    try {
      const { data, error } = await supabase
        .from('transfer_rumors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setRumors(data || []);
    } catch (error) {
      console.error('Error fetching transfer rumors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRumors();
  }, []);

  return { rumors, loading, refetch: fetchRumors };
}
