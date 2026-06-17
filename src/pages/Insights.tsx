import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Target, Globe, Zap, BarChart2, Trophy, Clock, CheckCircle } from 'lucide-react';

interface InsightData {
  totalPredictions: number; leagues: string[]; avgConfidence: number;
  highConf: number; byLeague: { league: string; count: number; avgConf: number }[];
  byOutcome: { outcome: string; count: number; pct: number }[];
  todayCount: number; premiumCount: number;
}

export default function Insights() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: preds } = await supabase.from('predictions')
        .select('league, prediction, predicted_outcome, confidence, confidence_score, is_premium, match_date');
      if (!preds) return;

      const today = new Date().toISOString().split('T')[0];
      const allConf = preds.map(p => p.confidence_score ?? p.confidence ?? 0);
      const avgConf = Math.round(allConf.reduce((s, c) => s + c, 0) / allConf.length);

      const leagueMap: Record<string, { count: number; sum: number }> = {};
      const outcomeMap: Record<string, number> = {};
      preds.forEach(p => {
        if (!leagueMap[p.league]) leagueMap[p.league] = { count: 0, sum: 0 };
        leagueMap[p.league].count++;
        leagueMap[p.league].sum += p.confidence_score ?? p.confidence ?? 0;
        const o = p.predicted_outcome ?? p.prediction ?? 'Unknown';
        outcomeMap[o] = (outcomeMap[o] ?? 0) + 1;
      });

      const byLeague = Object.entries(leagueMap)
        .map(([league, { count, sum }]) => ({ league, count, avgConf: Math.round(sum / count) }))
        .sort((a, b) => b.count - a.count);

      const byOutcome = Object.entries(outcomeMap)
        .map(([outcome, count]) => ({ outcome, count, pct: Math.round((count / preds.length) * 100) }))
        .sort((a, b) => b.count - a.count);

      setData({
        totalPredictions: preds.length,
        leagues: [...new Set(preds.map(p => p.league))],
        avgConfidence: avgConf,
        highConf: preds.filter(p => (p.confidence_score ?? p.confidence ?? 0) >= 75).length,
        byLeague,
        byOutcome,
        todayCount: preds.filter(p => p.match_date?.startsWith(today)).length,
        premiumCount: preds.filter(p => p.is_premium).length,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="AI Prediction Insights | Stats & Analytics | PredictPro"
           description="Deep analytics on PredictPro AI football predictions. League coverage, outcome distribution, confidence breakdowns and accuracy metrics."
           canonical="/insights" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart2 className="h-8 w-8 text-primary" />Prediction Insights</h1>
          <p className="text-muted-foreground mt-1">Real-time analytics across all AI predictions.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted/30" /></Card>)}
          </div>
        ) : data && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Zap, label: 'Total Predictions', value: data.totalPredictions, color: 'text-primary' },
                { icon: CheckCircle, label: 'Avg Confidence', value: `${data.avgConfidence}%`, color: 'text-green-500' },
                { icon: Globe, label: 'Leagues', value: data.leagues.length, color: 'text-blue-500' },
                { icon: Trophy, label: 'High Confidence', value: data.highConf, color: 'text-amber-500' },
              ].map(({ icon: Icon, label, value, color }) => (
                <Card key={label}><CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-muted p-2.5"><Icon className={`h-5 w-5 ${color}`} /></div>
                    <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-black">{value}</p></div>
                  </div>
                </CardContent></Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* By League */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />By League</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {data.byLeague.map(l => (
                    <div key={l.league}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate max-w-[60%]">{l.league}</span>
                        <div className="flex gap-3 text-muted-foreground">
                          <span>{l.count} picks</span>
                          <span className="font-semibold text-primary">{l.avgConf}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(l.count / data.totalPredictions) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* By Outcome */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Outcome Distribution</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {data.byOutcome.map(o => (
                    <div key={o.outcome} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge className={`${o.outcome === 'Home Win' ? 'bg-green-500' : o.outcome === 'Away Win' ? 'bg-red-500' : 'bg-amber-500'} text-white w-24 justify-center`}>
                          {o.outcome}
                        </Badge>
                        <div className="flex-1 h-2 bg-muted rounded-full">
                          <div className={`h-full rounded-full ${o.outcome === 'Home Win' ? 'bg-green-500' : o.outcome === 'Away Win' ? 'bg-red-500' : 'bg-amber-500'}`}
                            style={{ width: `${o.pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-bold">{o.pct}%</span>
                        <span className="text-muted-foreground ml-1">({o.count})</span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between"><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Today's picks</span><span className="font-semibold text-foreground">{data.todayCount}</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Premium picks</span><span className="font-semibold text-foreground">{data.premiumCount}</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />75%+ confidence</span><span className="font-semibold text-green-600">{data.highConf}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
