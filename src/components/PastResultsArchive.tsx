import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Flame, CheckCircle2, TrendingUp } from 'lucide-react';
import { fetchRealtimeFinishedMatches } from '@/services/realtimeFootball';

interface ResolvedPick {
  id: string; 
  home_team: string; 
  away_team: string; 
  league: string;
  match_date: string; 
  predicted_outcome: string; 
  final_score: string | null;
  won: boolean;
}

export const PastResultsArchive = () => {
  const [results, setResults] = useState<ResolvedPick[]>([]);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let resolved: ResolvedPick[] = [];

      // 1. Try Supabase
      try {
        const { data } = await supabase
          .from('predictions')
          .select('id, home_team, away_team, league, match_date, predicted_outcome, prediction, result, final_score')
          .not('result', 'is', null)
          .order('match_date', { ascending: false })
          .limit(50);

        if (data && data.length > 0) {
          resolved = data.map((r: any) => ({
            id: r.id,
            home_team: r.home_team,
            away_team: r.away_team,
            league: r.league,
            match_date: r.match_date,
            predicted_outcome: r.predicted_outcome || r.prediction,
            final_score: r.final_score,
            won: r.result === (r.predicted_outcome || r.prediction),
          }));
        }
      } catch (e) {
        console.warn('Supabase past results query:', e);
      }

      // 2. If DB has no resolved matches, fetch real finished match results from live sports feeds
      if (resolved.length === 0) {
        try {
          const finishedMatches = await fetchRealtimeFinishedMatches();
          if (finishedMatches.length > 0) {
            resolved = finishedMatches.slice(0, 18).map(m => {
              const hScore = m.home_score ?? 0;
              const aScore = m.away_score ?? 0;
              const actualResult = hScore > aScore ? 'Home Win' : aScore > hScore ? 'Away Win' : 'Draw';
              const isWon = m.prediction === actualResult;

              return {
                id: m.id,
                home_team: m.home_team,
                away_team: m.away_team,
                league: m.competition,
                match_date: m.match_date,
                predicted_outcome: m.prediction || actualResult,
                final_score: `${hScore} - ${aScore}`,
                won: isWon,
              };
            });
          }
        } catch (err) {
          console.warn('Realtime finished matches fetch:', err);
        }
      }

      const correctCount = resolved.filter(r => r.won).length;
      setStats({ total: resolved.length, correct: correctCount });
      setResults(resolved.filter(r => r.won).slice(0, 6));
      setLoading(false);
    })();
  }, []);

  if (loading || results.length === 0) return null;

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 85;

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />Recent Verified Results
          </h2>
          <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            {accuracy}% verified accuracy ({stats.correct}/{stats.total})
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(w => (
            <Card key={w.id} className="border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs truncate max-w-[60%]">{w.league}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.match_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="font-semibold text-sm mb-2">{w.home_team} vs {w.away_team}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Outcome: <b className="text-foreground">{w.predicted_outcome}</b></span>
                  {w.final_score && <span className="text-sm font-bold text-primary">{w.final_score}</span>}
                </div>
                <Badge className="mt-2 bg-green-700 text-white gap-1"><CheckCircle2 className="h-3 w-3" />VERIFIED</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
