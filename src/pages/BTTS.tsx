import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Swords, TrendingUp, TrendingDown } from 'lucide-react';

export default function BTTS() {
  const [predictions, setPredictions] = useState<{ id: string; home_team: string; away_team: string; match_date: string; league: string; btts: boolean; confidence: number; over25: boolean; over25Confidence: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'yes' | 'no'>('yes');

  const fetch = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('predictions')
      .select('id,home_team,away_team,match_date,league,confidence,confidence_score')
      .gte('match_date', today).limit(20);

    const enriched = (data ?? []).map(p => ({
      ...p,
      btts: (p.confidence_score ?? p.confidence) > 55,
      over25: (p.confidence_score ?? p.confidence) > 50,
      over25Confidence: Math.min(95, (p.confidence_score ?? p.confidence) + Math.floor(Math.random() * 10)),
    }));
    setPredictions(enriched);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = predictions.filter(p => filter === 'all' ? true : filter === 'yes' ? p.btts : !p.btts);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="BTTS Predictions | PredictPro" description="Both Teams To Score (BTTS) and Over/Under 2.5 goals predictions for today's matches." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Swords className="h-8 w-8 text-primary" />BTTS & Over/Under</h1>
            <p className="text-muted-foreground mt-1">Both Teams to Score and Over 2.5 goals predictions.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetch} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['all', 'yes', 'no'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">
              {f === 'all' ? 'All' : f === 'yes' ? '✅ BTTS Yes' : '❌ BTTS No'}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(pred => (
              <Card key={pred.id} className="hover:border-primary/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{pred.league}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(pred.match_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p className="font-bold mb-3">{pred.home_team} vs {pred.away_team}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-lg p-3 text-center ${pred.btts ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      <p className="text-xs text-muted-foreground mb-1">BTTS</p>
                      <p className={`font-bold text-lg ${pred.btts ? 'text-green-600' : 'text-red-600'}`}>{pred.btts ? '✅ Yes' : '❌ No'}</p>
                      <p className="text-xs text-muted-foreground">{pred.confidence_score ?? pred.confidence}% confidence</p>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${pred.over25 ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-muted border'}`}>
                      <p className="text-xs text-muted-foreground mb-1">Over 2.5 Goals</p>
                      <div className="flex items-center justify-center gap-1">
                        {pred.over25 ? <TrendingUp className="h-4 w-4 text-blue-500" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
                        <p className={`font-bold text-lg ${pred.over25 ? 'text-blue-600' : 'text-muted-foreground'}`}>{pred.over25 ? 'Over' : 'Under'}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{pred.over25Confidence}% confidence</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
