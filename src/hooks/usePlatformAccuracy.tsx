import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccuracyData {
  date: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percent: number;
  by_league: Record<string, { total: number; correct: number; accuracy: number }>;
}

export function usePlatformAccuracy() {
  const [accuracyData, setAccuracyData] = useState<AccuracyData[]>([]);
  const [currentAccuracy, setCurrentAccuracy] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccuracyData = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_accuracy')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      const parsedData = (data || []).map((item: any) => ({
        ...item,
        by_league: typeof item.by_league === 'string' ? JSON.parse(item.by_league) : item.by_league || {},
      }));

      setAccuracyData(parsedData);
      if (parsedData.length > 0) {
        setCurrentAccuracy(parsedData[0]);
      }
    } catch (error) {
      console.error('Error fetching accuracy data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccuracyData();

    // Real-time subscription
    const channel = supabase
      .channel('accuracy-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_accuracy' }, () => {
        fetchAccuracyData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { accuracyData, currentAccuracy, loading, refetch: fetchAccuracyData };
}
