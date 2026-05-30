import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Zap, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { SharePrediction } from '@/components/SharePrediction';

interface PredResult {
  home_team: string; away_team: string; match_date: string; league: string;
  predicted_outcome: string; confidence_score: number; analysis: string;
  home_odds: number; draw_odds: number; away_odds: number;
  home_win_probability: number; draw_probability: number; away_win_probability: number;
  id: string; is_premium: boolean; status: string; created_at: string;
}

const LEAGUES = ['Premier League','La Liga','Serie A','Bundesliga','Ligue 1','Champions League','Europa League','KPL','AFCON','World Cup'];
const POPULAR = [
  { home: 'Arsenal', away: 'Chelsea', league: 'Premier League' },
  { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga' },
  { home: 'Gor Mahia', away: 'AFC Leopards', league: 'KPL' },
  { home: 'Man City', away: 'Liverpool', league: 'Premier League' },
];

export default function MatchPredictor() {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [league, setLeague] = useState('Premier League');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredResult | null>(null);

  const predict = async () => {
    if (!home.trim() || !away.trim()) { toast.error('Enter both team names'); return; }
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-prediction', {
        body: { home_team: home.trim(), away_team: away.trim(), match_date: date, league },
      });
      if (error || !data?.prediction) throw new Error(data?.error || 'Prediction failed');
      setResult(data.prediction);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate prediction');
    } finally { setLoading(false); }
  };

  const outcomeColor = (outcome: string) =>
    outcome === 'Home Win' ? 'text-green-500' : outcome === 'Away Win' ? 'text-red-500' : 'text-amber-500';

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Match Predictor | PredictPro" description="Enter any two teams and get an instant AI prediction with confidence score, odds, and detailed analysis." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            <Zap className="h-8 w-8 text-primary" />Match Predictor
          </h1>
          <p className="text-muted-foreground">Enter any two teams — our AI analyses form, H2H, and standings to predict the outcome.</p>
        </div>

        <Card className="mb-6 border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Home Team</Label>
                <Input placeholder="e.g. Arsenal" value={home} onChange={e => setHome(e.target.value)} onKeyDown={e => e.key === 'Enter' && predict()} />
              </div>
              <div className="space-y-1.5">
                <Label>Away Team</Label>
                <Input placeholder="e.g. Chelsea" value={away} onChange={e => setAway(e.target.value)} onKeyDown={e => e.key === 'Enter' && predict()} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>League</Label>
                <select value={league} onChange={e => setLeague(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Match Date</Label>
                <Input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={predict} disabled={loading} className="w-full gap-2" size="lg">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analysing with AI...</> : <><Zap className="h-4 w-4" />Predict Now</>}
            </Button>

            {/* Popular matches */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Popular matches:</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((m, i) => (
                  <button key={i} onClick={() => { setHome(m.home); setAway(m.away); setLeague(m.league); }}
                    className="text-xs px-2.5 py-1 bg-muted hover:bg-muted/80 rounded-full border transition-colors">
                    {m.home} vs {m.away}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{result.home_team} vs {result.away_team}</span>
                {result && <SharePrediction prediction={result} />}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{result.league} • {new Date(result.match_date).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Prediction */}
              <div className="text-center py-4 bg-background/60 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">AI Prediction</p>
                <p className={`text-3xl font-black ${outcomeColor(result.predicted_outcome)}`}>{result.predicted_outcome}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">{result.confidence_score}% confidence</span>
                </div>
              </div>

              {/* Probability bars */}
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" />Win Probabilities</p>
                {[
                  { label: result.home_team, prob: result.home_win_probability, odds: result.home_odds, color: 'bg-green-500' },
                  { label: 'Draw', prob: result.draw_probability, odds: result.draw_odds, color: 'bg-amber-500' },
                  { label: result.away_team, prob: result.away_win_probability, odds: result.away_odds, color: 'bg-red-500' },
                ].map(({ label, prob, odds, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate max-w-[60%]">{label}</span>
                      <div className="flex gap-3">
                        {odds && <span className="text-primary font-semibold">@ {odds.toFixed(2)}</span>}
                        <span className="text-muted-foreground">{prob}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${prob}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Analysis */}
              {result.analysis && (
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-primary" />AI Analysis</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.analysis}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
