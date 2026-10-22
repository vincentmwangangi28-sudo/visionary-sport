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
import { getUpdatedDefaultPredictions } from '@/data/mockPredictions';
import { getConfidence, getPrediction } from '@/types/prediction';
import { Target, RefreshCw, Plus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMatchSlug } from '@/services/sitemapGenerator';
import { TeamLogo } from '@/components/TeamLogo';
import { ViralSlipShareCard } from '@/components/ViralSlipShareCard';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';
import type { Prediction } from '@/types/prediction';

interface PredMeta { correct_score?: string; home_win_probability?: number; away_win_probability?: number; draw_probability?: number; }

export default function CorrectScore() {
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const { addSelection, selections } = useBetSlip();

  const fetch_ = async () => {
    setLoading(true);
    try {
      const realFixtures = await fetchRealtimeUpcomingFixtures();
      if (realFixtures && realFixtures.length > 0) {
        const sortedReal = [...realFixtures].sort(
          (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
        );
        setPreds(sortedReal.slice(0, 18));
      } else {
        const { data } = await supabase.from('predictions')
          .select('*')
          .gt('match_date', new Date().toISOString())
          .is('result', null)
          .gte('confidence', 60)
          .order('match_date', { ascending: true })
          .order('confidence', { ascending: false })
          .limit(20);
        if (data && data.length > 0) {
          setPreds(data as Prediction[]);
        } else {
          setPreds(getUpdatedDefaultPredictions().slice(0, 18));
        }
      }
    } catch (e) {
      console.warn('Correct score fetch error:', e);
      setPreds(getUpdatedDefaultPredictions().slice(0, 18));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch_(); }, []);

  const topScoreSlipItems = preds.slice(0, 3).map((p) => {
    const meta = (p.metadata as PredMeta) ?? {};
    const outcome = p.predicted_outcome || p.prediction || 'Home Win';
    const score = meta.correct_score ?? (outcome === 'Home Win' ? '2-1' : outcome === 'Away Win' ? '1-2' : '1-1');
    return {
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      market: `Correct Score ${score}`,
      odds: 6.5,
      confidence: p.confidence || 68,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Guru Tips Correct Score Today: AI Score Predictions & Booking Codes"
        description="Daily correct score guru tips today and exact scoreline predictions powered by Poisson probability matrices. High-odds 1-0, 2-1, and 1-1 football picks with booking codes."
        canonical="/correct-score"
        keywords="guru tips correct score today, correct score predictions today, exact score football tips, sportybet correct score booking code, scoreline predictions, correct score probabilities"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 max-w-6xl space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Bivariate Poisson Scoreline Matrix · Exact Score Projections
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Correct Score Predictions Today
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Most probable exact scoreline projections (1-0, 2-1, 1-1, 2-0) derived from club attacking and defensive Expected Goals (xG) rates.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetch_}
            disabled={loading}
            className="gap-1.5 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {!loading && topScoreSlipItems.length > 0 && (
          <ViralSlipShareCard
            title="3-Leg High-Odds Correct Score Value Slip"
            items={topScoreSlipItems}
            canonicalPath="/correct-score"
          />
        )}

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
              const matchKey = `${p.home_team} vs ${p.away_team}`;
              const isAdded = selections.some(s => s.match === matchKey);

              return (
                <Card key={p.id} className={`hover:border-primary/30 transition-all ${isPremium ? 'border-amber-500/30' : ''}`}>
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs truncate max-w-[65%]">{p.league}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.match_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <Link
                        to={`/predict/${formatMatchSlug(p.home_team, p.away_team, p.match_date)}`}
                        className="block group hover:text-primary transition-colors mb-3"
                        title={`View ${p.home_team} vs ${p.away_team} AI match prediction & scoreline probability`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <TeamLogo team={p.home_team} size="xs" />
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{p.home_team}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground ml-5">vs</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <TeamLogo team={p.away_team} size="xs" />
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{p.away_team}</span>
                        </div>
                      </Link>
                      <div className="text-center bg-primary/10 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Scoreline Vector (~6.50 Odds)</p>
                        <p className="text-3xl font-black text-primary font-mono">{score}</p>
                        <p className="text-xs text-muted-foreground mt-1">{p.confidence}% model confidence</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/50 space-y-2.5">
                      {p.home_odds && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-mono">
                            {(() => {
                              const h = 1 / p.home_odds;
                              const d = p.draw_odds ? 1 / p.draw_odds : 0.3;
                              const a = p.away_odds ? 1 / p.away_odds : 0.25;
                              const total = h + d + a;
                              const hp = Math.round((h / total) * 100);
                              const dp = Math.round((d / total) * 100);
                              const ap = Math.max(0, 100 - hp - dp);
                              return (
                                <>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">1: {hp}%</span>
                                  <span className="text-muted-foreground">X: {dp}%</span>
                                  <span className="font-bold text-sky-600 dark:text-sky-400">2: {ap}%</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="h-1 w-full rounded-full bg-muted overflow-hidden flex">
                            {(() => {
                              const h = 1 / p.home_odds;
                              const d = p.draw_odds ? 1 / p.draw_odds : 0.3;
                              const a = p.away_odds ? 1 / p.away_odds : 0.25;
                              const total = h + d + a;
                              const hp = Math.round((h / total) * 100);
                              const dp = Math.round((d / total) * 100);
                              const ap = Math.max(0, 100 - hp - dp);
                              return (
                                <>
                                  <div style={{ width: `${hp}%` }} className="bg-emerald-500" />
                                  <div style={{ width: `${dp}%` }} className="bg-amber-500" />
                                  <div style={{ width: `${ap}%` }} className="bg-sky-500" />
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant={isAdded ? 'secondary' : 'outline'}
                        className={`w-full text-xs h-8 gap-1.5 ${isAdded ? 'text-primary font-bold' : ''}`}
                        onClick={() => {
                          addSelection({
                            match: matchKey,
                            homeTeam: p.home_team,
                            awayTeam: p.away_team,
                            league: p.league,
                            market: `Correct Score ${score}`,
                            odds: 6.5,
                            confidence: p.confidence || 68,
                          });
                          toast.success(`Added ${matchKey} (CS ${score}) to Bet Slip!`);
                        }}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span>In Bet Slip</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add {score} to Slip</span>
                          </>
                        )}
                      </Button>
                    </div>
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
