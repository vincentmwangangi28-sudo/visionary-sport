import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Globe, BarChart3 } from 'lucide-react';

const COLORS = ['#6d28d9','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16'];

export default function Statistics() {
  const [leagueStats, setLeagueStats] = useState<{league: string; count: number; avgConf: number}[]>([]);
  const [outcomeStats, setOutcomeStats] = useState<{name: string; value: number}[]>([]);
  const [confDistribution, setConfDistribution] = useState<{range: string; count: number}[]>([]);
  const [totals, setTotals] = useState({ predictions: 0, avgConfidence: 0, highConf: 0, leagues: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('predictions').select('league, prediction, predicted_outcome, confidence, confidence_score');
      if (!data?.length) return;

      // League breakdown
      const lm: Record<string, { count: number; sum: number }> = {};
      data.forEach(p => {
        if (!lm[p.league]) lm[p.league] = { count: 0, sum: 0 };
        lm[p.league].count++;
        lm[p.league].sum += p.confidence_score ?? p.confidence ?? 0;
      });
      setLeagueStats(Object.entries(lm).map(([league, { count, sum }]) => ({ league: league.length > 14 ? league.slice(0, 14) + '…' : league, count, avgConf: Math.round(sum / count) })).sort((a, b) => b.count - a.count));

      // Outcome distribution
      const om: Record<string, number> = {};
      data.forEach(p => { const o = p.predicted_outcome ?? p.prediction ?? 'Unknown'; om[o] = (om[o] ?? 0) + 1; });
      setOutcomeStats(Object.entries(om).map(([name, value]) => ({ name, value })));

      // Confidence distribution
      const ranges = [
        { range: '40-50%', min: 40, max: 50 }, { range: '51-60%', min: 51, max: 60 },
        { range: '61-70%', min: 61, max: 70 }, { range: '71-80%', min: 71, max: 80 },
        { range: '81-90%', min: 81, max: 90 }, { range: '91-100%', min: 91, max: 100 },
      ];
      setConfDistribution(ranges.map(r => ({
        range: r.range,
        count: data.filter(p => { const c = p.confidence_score ?? p.confidence ?? 0; return c >= r.min && c <= r.max; }).length,
      })));

      const allConf = data.map(p => p.confidence_score ?? p.confidence ?? 0);
      setTotals({
        predictions: data.length,
        avgConfidence: Math.round(allConf.reduce((s, c) => s + c, 0) / data.length),
        highConf: data.filter(p => (p.confidence_score ?? p.confidence ?? 0) >= 75).length,
        leagues: Object.keys(lm).length,
      });
    })();
  }, []);

  const StatCard = ({ icon: Icon, label, value, sub }: { icon: typeof Target; label: string; value: string | number; sub?: string }) => (
    <Card><CardContent className="p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-3"><Icon className="h-5 w-5 text-primary" /></div>
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
      </div>
    </CardContent></Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO title="AI Prediction Statistics | Accuracy by League | PredictPro" description="PredictPro AI accuracy statistics across all football leagues. Win rates, confidence distributions and prediction performance analytics." keywords="football prediction accuracy, AI football statistics, prediction win rate, betting statistics football" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart3 className="h-8 w-8 text-primary" />Global Statistics</h1>
          <p className="text-muted-foreground mt-1">Real-time AI prediction analytics across all leagues worldwide.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Target} label="Total Predictions" value={totals.predictions} />
          <StatCard icon={TrendingUp} label="Avg Confidence" value={`${totals.avgConfidence}%`} />
          <StatCard icon={BarChart3} label="High Confidence" value={totals.highConf} sub="≥75% confidence" />
          <StatCard icon={Globe} label="Leagues Covered" value={totals.leagues} sub="Worldwide" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Predictions by League</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={leagueStats} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="league" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v: number) => [v, 'Predictions']} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Outcome Distribution</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={outcomeStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {outcomeStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Confidence Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v, 'Predictions']} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
