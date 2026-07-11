import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { Zap, Loader2, TrendingUp, Target, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdBannerHorizontal } from '@/components/AdBanner';

const LEAGUES = ['Premier League','La Liga','Champions League','Bundesliga','Serie A','Ligue 1','KPL','AFCON Qualifier','MLS','Europa League'];

interface PredResult {
  predicted_outcome?: string; confidence_score?: number;
  home_win_probability?: number; draw_probability?: number; away_win_probability?: number;
  home_odds?: number; draw_odds?: number; away_odds?: number;
  analysis?: string; correct_score?: string;
}

export default function MatchPredictor() {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [league, setLeague] = useState('Premier League');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredResult | null>(null);

  const predict = async () => {
    if (!home.trim() || !away.trim()) { toast.error('Enter both team names'); return; }
    setLoading(true); setResult(null);
    try {
      const data = await callEdgeFn('generate-prediction', {
        home_team: home.trim(), away_team: away.trim(), league,
        match_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        is_premium: false
      }) as { prediction?: PredResult; success?: boolean };
      if (data?.prediction) {
        setResult(data.prediction);
      } else throw new Error('No prediction returned');
    } catch (e) {
      toast.error('Prediction failed. Please try again.');
      console.error(e);
    } finally { setLoading(false); }
  };

  const POPULAR = [
    {home:'Arsenal',away:'Chelsea',league:'Premier League'},
    {home:'Real Madrid',away:'Barcelona',league:'La Liga'},
    {home:'Bayern Munich',away:'Dortmund',league:'Bundesliga'},
    {home:'Gor Mahia',away:'AFC Leopards',league:'KPL'},
    {home:'Inter Miami',away:'LA Galaxy',league:'MLS'},
    {home:'Nigeria',away:'Ghana',league:'AFCON Qualifier'},
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="AI Match Predictor | Predict Any Football Match | PredictPro"
        description="Enter any two teams and get an instant AI prediction. Confidence scores, win probabilities, odds and detailed analysis powered by Google Gemini AI."
        canonical="/predict" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            <Zap className="h-8 w-8 text-primary" />Match Predictor
          </h1>
          <p className="text-muted-foreground">Enter any two teams for an instant AI prediction.</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Home Team</label>
                <Input placeholder="e.g. Arsenal" value={home} onChange={e => setHome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && predict()} className="text-base" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Away Team</label>
                <Input placeholder="e.g. Chelsea" value={away} onChange={e => setAway(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && predict()} className="text-base" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">League / Competition</label>
              <Select value={league} onValueChange={setLeague}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAGUES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={predict} disabled={loading || !home || !away} className="w-full gap-2" size="lg">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Analysing...</> : <><Zap className="h-5 w-5" />Predict Now</>}
            </Button>
          </CardContent>
        </Card>

        {/* Quick picks */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">Quick predictions:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map(m => (
              <button key={m.home} onClick={() => { setHome(m.home); setAway(m.away); setLeague(m.league); }}
                className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-full border transition-colors">
                {m.home} vs {m.away}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <Card className="border-primary/30 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{home} vs {away}</CardTitle>
              <Badge variant="outline">{league}</Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Main prediction */}
              <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">AI Prediction</p>
                  <Badge className={`text-lg px-4 py-1.5 font-bold ${result.predicted_outcome==='Home Win'?'bg-green-500':result.predicted_outcome==='Away Win'?'bg-red-500':'bg-amber-500'} text-white`}>
                    {result.predicted_outcome ?? 'Draw'}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                  <p className="text-4xl font-black text-primary">{result.confidence_score ?? 65}%</p>
                </div>
                {result.correct_score && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Predicted Score</p>
                    <p className="text-2xl font-black">{result.correct_score}</p>
                  </div>
                )}
              </div>

              {/* Probabilities */}
              {result.home_win_probability !== undefined && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary"/>Win Probabilities</p>
                  {[
                    { label: home, prob: result.home_win_probability, odds: result.home_odds, color: 'bg-green-500' },
                    { label: 'Draw', prob: result.draw_probability, odds: result.draw_odds, color: 'bg-amber-500' },
                    { label: away, prob: result.away_win_probability, odds: result.away_odds, color: 'bg-red-500' },
                  ].map(({ label, prob, odds, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate max-w-[50%]">{label}</span>
                        <div className="flex gap-3 text-muted-foreground">
                          {odds && <span className="font-bold text-primary">@ {odds.toFixed(2)}</span>}
                          <span>{prob ?? 0}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${prob ?? 0}%` }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Analysis */}
              {result.analysis && (
                <div className="bg-muted/20 rounded-lg p-4">
                  <p className="text-sm font-semibold flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-primary"/>AI Analysis</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.analysis}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <AdBannerHorizontal className="mt-6" />
      </main>
      <Footer />
    </div>
  );
}
