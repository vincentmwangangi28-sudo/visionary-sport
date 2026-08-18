import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Flame, CheckCircle2, TrendingUp } from 'lucide-react';

interface ResolvedPick {
  id: string; home_team: string; away_team: string; league: string;
  match_date: string; predicted_outcome: string; final_score: string | null;
}

export const PastResultsArchive = () => {
  const [wins, setWins] = useState<ResolvedPick[]>([]);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('predictions')
        .select('id, home_team, away_team, league, match_date, predicted_outcome, prediction, result, final_score')
        .not('result', 'is', null)
        .order('match_date', { ascending: false })
        .limit(50);

      const rows = data ?? [];
      const resolved = rows as unknown as (ResolvedPick & { result: string; prediction: string })[];
      const correct = resolved.filter(r => r.result === (r.predicted_outcome ?? r.prediction));
      setStats({ total: resolved.length, correct: correct.length });
      setWins(correct.slice(0, 6));
      setLoading(false);
    })();
  }, []);

  // Nothing resolved yet — this is genuinely empty right now (results-resolution
  // pipeline just went live), not hidden. Show an honest, on-brand placeholder
  // rather than fabricated history.
  if (!loading && stats.total === 0) {
    return (
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center">
              <Flame className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-bold text-lg mb-1">🔥 Our Winning Streak Starts Here</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                We track every prediction against real match results. Check back after today's fixtures finish — verified wins will appear here automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (loading || wins.length === 0) return null;

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />Our Recent Winning Streak
          </h2>
          <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            {accuracy}% verified accuracy ({stats.correct}/{stats.total})
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wins.map(w => (
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
                  <span className="text-xs text-muted-foreground">Predicted: <b className="text-foreground">{w.predicted_outcome}</b></span>
                  {w.final_score && <span className="text-sm font-bold">{w.final_score}</span>}
                </div>
                <Badge className="mt-2 bg-green-700 text-white gap-1"><CheckCircle2 className="h-3 w-3" />WON</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
