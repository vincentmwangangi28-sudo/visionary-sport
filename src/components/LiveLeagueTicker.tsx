import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from 'lucide-react';

interface LeagueStat { league: string; count: number; avgConfidence: number; }

export const LiveLeagueTicker = () => {
  const [stats, setStats] = useState<LeagueStat[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('predictions')
        .select('league, confidence, confidence_score')
        .gte('match_date', today);

      const map: Record<string, { total: number; sum: number }> = {};
      (data ?? []).forEach(p => {
        if (!map[p.league]) map[p.league] = { total: 0, sum: 0 };
        map[p.league].total++;
        map[p.league].sum += p.confidence_score ?? p.confidence ?? 0;
      });

      setStats(Object.entries(map).map(([league, { total, sum }]) => ({
        league, count: total, avgConfidence: Math.round(sum / total),
      })).sort((a, b) => b.count - a.count));
    };
    fetch();
  }, []);

  if (!stats.length) return null;

  return (
    <div className="bg-muted/30 border-b border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-1.5 animate-none">
        <Activity className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <div className="flex gap-6 overflow-x-auto scrollbar-none text-xs text-muted-foreground whitespace-nowrap">
          {stats.map(s => (
            <span key={s.league} className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">{s.league}</span>
              <span>{s.count} predictions</span>
              <span className="text-primary font-semibold">{s.avgConfidence}% avg</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
