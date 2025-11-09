import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AccuracyStats {
  overall: number;
  byLeague: { league: string; accuracy: number; total: number }[];
  byConfidence: { range: string; accuracy: number; total: number }[];
  weekly: { week: string; accuracy: number }[];
  totalPredictions: number;
}

export const useAccuracyStats = () => {
  const [stats, setStats] = useState<AccuracyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccuracyStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchAccuracyStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchAccuracyStats = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions_history')
        .select('is_correct, competition, confidence, match_date')
        .not('is_correct', 'is', null);

      if (error) throw error;

      const total = data?.length || 0;
      const correct = data?.filter(p => p.is_correct).length || 0;
      const overall = total > 0 ? (correct / total) * 100 : 0;

      // By league
      const leagueMap = new Map<string, { correct: number; total: number }>();
      data?.forEach(p => {
        const league = p.competition || 'Other';
        const stats = leagueMap.get(league) || { correct: 0, total: 0 };
        stats.total++;
        if (p.is_correct) stats.correct++;
        leagueMap.set(league, stats);
      });

      const byLeague = Array.from(leagueMap.entries())
        .map(([league, stats]) => ({
          league,
          accuracy: (stats.correct / stats.total) * 100,
          total: stats.total
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // By confidence
      const confidenceRanges = [
        { range: '90-100%', min: 90, max: 100 },
        { range: '80-89%', min: 80, max: 89 },
        { range: '70-79%', min: 70, max: 79 },
        { range: '60-69%', min: 60, max: 69 }
      ];

      const byConfidence = confidenceRanges.map(({ range, min, max }) => {
        const filtered = data?.filter(p => p.confidence >= min && p.confidence <= max) || [];
        const correct = filtered.filter(p => p.is_correct).length;
        return {
          range,
          accuracy: filtered.length > 0 ? (correct / filtered.length) * 100 : 0,
          total: filtered.length
        };
      });

      // Weekly accuracy (last 4 weeks)
      const now = new Date();
      const weekly = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i + 1) * 7);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - i * 7);

        const weekData = data?.filter(p => {
          const date = new Date(p.match_date);
          return date >= weekStart && date < weekEnd;
        }) || [];

        const weekCorrect = weekData.filter(p => p.is_correct).length;
        weekly.unshift({
          week: `Week ${4 - i}`,
          accuracy: weekData.length > 0 ? (weekCorrect / weekData.length) * 100 : 0
        });
      }

      setStats({
        overall,
        byLeague,
        byConfidence,
        weekly,
        totalPredictions: total
      });
    } catch (error) {
      console.error('Error fetching accuracy stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchAccuracyStats };
};
