import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPerformance {
  total_predictions: number;
  correct_predictions: number;
  average_confidence: number;
  win_rate: number;
}

const CACHE_KEY = 'user_performance_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCached = (): { data: any; timestamp: number } | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const useUserPerformance = () => {
  const [performance, setPerformance] = useState<UserPerformance | null>(() => {
    const cached = getCached();
    return cached?.data || null;
  });
  const [loading, setLoading] = useState(() => !getCached());

  const fetchPerformance = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const { data, error } = await supabase.functions.invoke('fetch-user-performance', {
        body: {},
      });

      clearTimeout(timeout);

      if (error) {
        console.error('Error fetching user performance:', error);
        return;
      }

      setPerformance(data);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setPerformance(cached.data);
      setLoading(false);
      // Refresh in background
      fetchPerformance();
    } else {
      fetchPerformance();
    }
  }, [fetchPerformance]);

  return { performance, loading, refetch: fetchPerformance };
};
