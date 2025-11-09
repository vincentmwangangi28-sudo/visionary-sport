import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  badges: string[];
}

export const useStreakData = () => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    badges: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchStreakData();
  }, [user]);

  const fetchStreakData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('predictions_history')
        .select('is_correct, match_date')
        .eq('user_id', user.id)
        .order('match_date', { ascending: false });

      if (error) throw error;

      // Calculate current and longest streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      for (const prediction of data || []) {
        if (prediction.is_correct === true) {
          tempStreak++;
          if (currentStreak === tempStreak - 1) {
            currentStreak = tempStreak;
          }
          longestStreak = Math.max(longestStreak, tempStreak);
        } else if (prediction.is_correct === false) {
          if (currentStreak === tempStreak) {
            // Streak ended
            break;
          }
          tempStreak = 0;
        }
      }

      // Award badges based on longest streak
      const badges: string[] = [];
      if (longestStreak >= 3) badges.push('🔥 Hot Hand');
      if (longestStreak >= 5) badges.push('🎯 Sharp Shooter');
      if (longestStreak >= 10) badges.push('👑 Prediction King');
      if (longestStreak >= 15) badges.push('🌟 Legend');

      setStreakData({
        currentStreak,
        longestStreak,
        badges
      });
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { streakData, loading, refetch: fetchStreakData };
};
