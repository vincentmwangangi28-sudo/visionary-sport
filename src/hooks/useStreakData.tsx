import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCorrect: number;
  totalPredictions: number;
  badges: string[];
}

export const useStreakData = () => {
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, totalCorrect: 0, totalPredictions: 0, badges: [] });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchStreakData();
  }, [user]);

  const fetchStreakData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Use DB-side RPC — O(1) instead of O(n) client loop
      const { data, error } = await supabase.rpc('get_user_streak', { uid: user.id });
      if (error) throw error;
      const d = data as { current_streak: number; longest_streak: number; total_correct: number; total_predictions: number } | null;
      const longest = d?.longest_streak ?? 0;
      const badges: string[] = [];
      if (longest >= 3) badges.push('🔥 Hot Hand');
      if (longest >= 5) badges.push('🎯 Sharp Shooter');
      if (longest >= 10) badges.push('👑 Prediction King');
      if (longest >= 15) badges.push('🌟 Legend');
      setStreakData({ currentStreak: d?.current_streak ?? 0, longestStreak: longest, totalCorrect: d?.total_correct ?? 0, totalPredictions: d?.total_predictions ?? 0, badges });
    } catch { /* keep defaults */ } finally { setLoading(false); }
  };

  return { streakData, loading, refetch: fetchStreakData };
};
