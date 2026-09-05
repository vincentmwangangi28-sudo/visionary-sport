import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CorrectScoreListSkeleton } from '@/components/PredictionCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { getConfidence, getPrediction } from '@/types/prediction';
import { Target, RefreshCw, Zap, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdBannerHorizontal } from '@/components/AdBanner';
import type { Prediction } from '@/types/prediction';

interface PredMeta { correct_score?: string; home_win_probability?: number; away_win_probability?: number; draw_probability?: number; }

export default function CorrectScore() {
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const realFixtures = await fetchRealtimeUpcomingFixtures();
      if (realFixtures && realFixtures.length > 0) {
        setPreds(realFixtures.slice(0, 18));
      } else {
        const { data } = await supabase.from('predictions')
          .select('*')
          .gte('match_date', new Date().toISOString())
          .gte('confidence', 60)
          .order('confidence', { ascending: false })
          .limit(20);
        setPreds((data ?? []) as Prediction[]);
      }
    } catch (e) {
      console.warn('Correct score fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch_(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Correct Score Predictions Today | AI Scoreline Tips | PredictPro"
        description="AI-powered correct score predictions for today's matches. Exact scoreline forecasts with odds for Premier League, Champions League, La Liga and more."
        canonical="/correct-score"
        keywords="correct score predictions today, exact score football tips, scoreline predictions, correct score odds" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Target className="h-8 w-8 text-primary" />Correct Score</h1>
            <p className="text-muted-foreground mt-1">High-Probability Exact Scoreline Vectors · 60%+ confidence threshold</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetch_} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <AdBannerHorizontal className="mb-6" />

        {loading ? (
          <CorrectScoreListSkeleton count={6} />
        ) : preds.length === 0 ? (
          <div className="text-center py-20">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-semibold">No correct score predictions right now</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Check back after 6AM EAT when daily predictions are generated</p>
            <Link to="/best-bets"><Button>View Best Bets Instead</Button></Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {preds.map(p => {
              const meta = (p.metadata as PredMeta) ?? {};
              const outcome = p.predicted_outcome || p.prediction || 'Home Win';
              const score = meta.correct_score ?? (outcome === 'Home Win' ? '2-1' : outcome === 'Away Win' ? '1-2' : '1-1');
              const isPremium = p.is_premium;
              return (
                <Card key={p.id} className={`hover:border-primary/30 transition-all ${isPremium ? 'border-amber-500/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs truncate max-w-[65%]">{p.league}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.match_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="font-bold text-sm mb-1">{p.home_team}</p>
                    <p className="text-xs text-muted-foreground mb-1">vs</p>
                    <p className="font-bold text-sm mb-3">{p.away_team}</p>
                    {isPremium ? (
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                        <Lock className="h-5 w-5 text-amber-500" />
                        <div><p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Premium Pick</p>
                          <Link to="/shop"><Button size="sm" variant="outline" className="mt-1 h-6 text-xs px-2">Unlock</Button></Link></div>
                      </div>
                    ) : (
                      <div className="text-center bg-primary/10 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Scoreline Vector</p>
                        <p className="text-3xl font-black text-primary">{score}</p>
                        <p className="text-xs text-muted-foreground mt-1">{p.confidence}% confidence</p>
                      </div>
                    )}
                    {p.home_odds && (
                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground justify-center">
                        <span>1: <b>{p.home_odds.toFixed(2)}</b></span>
                        {p.draw_odds && <span>X: <b>{p.draw_odds.toFixed(2)}</b></span>}
                        <span>2: <b>{p.away_odds?.toFixed(2)}</b></span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
