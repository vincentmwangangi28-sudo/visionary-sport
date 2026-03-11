import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccuracyData {
  date: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percent: number;
  by_league: Record<string, { total: number; correct: number; accuracy: number }>;
}

const CACHE_KEY = 'platform_accuracy_cache';
const CACHE_TTL = 5 * 60_000; // 5 minutes

interface CachedAccuracy {
  accuracyData: AccuracyData[];
  cachedAt: number;
}

function getCache(): CachedAccuracy | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedAccuracy = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL) return null;
    return parsed;
  } catch { return null; }
}

function setCache(accuracyData: AccuracyData[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ accuracyData, cachedAt: Date.now() }));
  } catch {}
}

export function usePlatformAccuracy() {
  const [accuracyData, setAccuracyData] = useState<AccuracyData[]>([]);
  const [currentAccuracy, setCurrentAccuracy] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const applyData = (parsed: AccuracyData[]) => {
    if (!mounted.current) return;
    setAccuracyData(parsed);
    if (parsed.length > 0) setCurrentAccuracy(parsed[0]);
  };

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

      applyData(parsedData);
      setCache(parsedData);
    } catch (error) {
      console.error('Error fetching accuracy data:', error);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;

    // Serve cached data instantly
    const cached = getCache();
    if (cached) {
      applyData(cached.accuracyData);
      setLoading(false);
    }

    // Stale-while-revalidate
    fetchAccuracyData();

    const channel = supabase
      .channel('accuracy-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_accuracy' }, () => {
        fetchAccuracyData();
      })
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { accuracyData, currentAccuracy, loading, refetch: fetchAccuracyData };
}
