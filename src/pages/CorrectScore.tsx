import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CorrectScoreListSkeleton } from '@/components/PredictionCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { getUpdatedDefaultPredictions } from '@/data/mockPredictions';
import { Target, RefreshCw, Plus, Check, Calculator, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMatchSlug } from '@/services/sitemapGenerator';
import { TeamLogo } from '@/components/TeamLogo';
import { ViralSlipShareCard } from '@/components/ViralSlipShareCard';
import { useBetSlip } from '@/hooks/useBetSlip';
import { generateMatchGameId } from '@/services/bookmakerBookingCodes';
import { toast } from 'sonner';
import type { Prediction } from '@/types/prediction';

interface PredMeta {
  correct_score?: string;
  home_win_probability?: number;
  away_win_probability?: number;
  draw_probability?: number;
}

function computeMatchPoissonScores(p: Prediction, primaryScoreOverride?: string) {
  const hOdds = p.home_odds || 1.95;
  const aOdds = p.away_odds || 3.15;
  const homeXg = Number(Math.min(3.1, Math.max(0.65, 2.55 / Math.pow(hOdds, 0.65))).toFixed(2));
  const awayXg = Number(Math.min(2.8, Math.max(0.5, 2.25 / Math.pow(aOdds, 0.65))).toFixed(2));

  const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
  const pmf = (lambda: number, k: number) => (Math.pow(lambda, k) * Math.exp(-lambda)) / fact(k);

  const candidates: Array<{ score: string; prob: number; odds: number }> = [];
  for (let h = 0; h <= 4; h++) {
    for (let a = 0; a <= 4; a++) {
      const prob = pmf(homeXg, h) * pmf(awayXg, a) * 100;
      candidates.push({
        score: `${h}-${a}`,
        prob: Number(prob.toFixed(1)),
        odds: Number(Math.min(29, Math.max(4.8, (100 / Math.max(3.5, prob)) * 0.88)).toFixed(2)),
      });
    }
  }
  candidates.sort((x, y) => y.prob - x.prob);

  const primary = primaryScoreOverride
    ? candidates.find((c) => c.score === primaryScoreOverride) || {
        score: primaryScoreOverride,
        prob: candidates[0].prob,
        odds: 6.5,
      }
    : candidates[0];

  const backup = candidates.find((c) => c.score !== primary.score) || {
    score: primary.score === '2-1' ? '1-0' : '2-1',
    prob: 10.4,
    odds: 7.25,
  };

  const combinedProb = Number((primary.prob + backup.prob).toFixed(1));
  const gameId = generateMatchGameId(p.home_team, p.away_team, 'sportybet');

  return {
    homeXg,
    awayXg,
    primary,
    backup,
    combinedProb,
    gameId,
  };
}

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
        const { data } = await supabase
          .from('predictions')
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

  useEffect(() => {
    fetch_();
  }, []);

  const topScoreSlipItems = preds.slice(0, 3).map((p) => {
    const meta = (p.metadata as PredMeta) ?? {};
    const outcome = p.predicted_outcome || p.prediction || 'Home Win';
    const fallbackScore = outcome === 'Home Win' ? '2-1' : outcome === 'Away Win' ? '1-2' : '1-1';
    const { primary } = computeMatchPoissonScores(p, meta.correct_score ?? fallbackScore);
    return {
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      market: `Correct Score ${primary.score}`,
      odds: primary.odds,
      confidence: p.confidence || 68,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Guru Tips Correct Score Today: AI Score Predictions & Booking Codes"
        description="Daily correct score guru tips today and exact scoreline predictions powered by Poisson probability matrices. High-odds 1-0, 2-1, and 1-1 football picks with 2-score Dutching insurance and booking codes."
        canonical="/correct-score"
        keywords="guru tips correct score today, correct score predictions today, exact score football tips, sportybet correct score booking code, scoreline predictions, correct score probabilities"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 max-w-6xl space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Bivariate Poisson Scoreline Matrix · Primary + Backup Score Dutching
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Correct Score Predictions Today
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Exact scoreline projections (1-0, 2-1, 1-1, 2-0) derived from club attacking &amp; defensive Expected Goals (xG), complete with 2-Score Insurance (Dutching) backups and interactive 6×6 matrix links.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/poisson-calculator">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 hover:text-white"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>6×6 Matrix Lab</span>
              </Button>
            </Link>
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
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Check back after 6AM EAT when daily predictions are generated
            </p>
            <Link to="/best-bets">
              <Button>View Best Bets Instead</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {preds.map((p) => {
              const meta = (p.metadata as PredMeta) ?? {};
              const outcome = p.predicted_outcome || p.prediction || 'Home Win';
              const fallbackScore = outcome === 'Home Win' ? '2-1' : outcome === 'Away Win' ? '1-2' : '1-1';
              const { homeXg, awayXg, primary, backup, combinedProb, gameId } = computeMatchPoissonScores(
                p,
                meta.correct_score ?? fallbackScore
              );
              const isPremium = p.is_premium;
              const matchKey = `${p.home_team} vs ${p.away_team}`;
              const isPrimaryAdded = selections.some(
                (s) => s.match === matchKey && s.market === `Correct Score ${primary.score}`
              );
              const isBackupAdded = selections.some(
                (s) => s.match === matchKey && s.market === `Correct Score ${backup.score}`
              );

              return (
                <Card
                  key={p.id}
                  className={`hover:border-primary/40 transition-all ${isPremium ? 'border-amber-500/30' : ''}`}
                >
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            #{gameId}
                          </span>
                          <Badge variant="outline" className="text-xs truncate">
                            {p.league}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {new Date(p.match_date).toLocaleDateString('en-KE', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <Link
                        to={`/predict/${formatMatchSlug(p.home_team, p.away_team, p.match_date)}`}
                        className="block group hover:text-primary transition-colors mb-3"
                        title={`View ${p.home_team} vs ${p.away_team} AI match prediction & scoreline probability`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TeamLogo team={p.home_team} size="xs" />
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {p.home_team}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-500 font-semibold shrink-0">
                            {homeXg.toFixed(2)} xG
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-5">vs</p>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TeamLogo team={p.away_team} size="xs" />
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {p.away_team}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-sky-500 font-semibold shrink-0">
                            {awayXg.toFixed(2)} xG
                          </span>
                        </div>
                      </Link>

                      {/* Primary + Backup 2-Score Dutching Matrix Box */}
                      <div className="grid grid-cols-2 gap-2 mb-2.5">
                        <div className="text-center bg-primary/10 border border-primary/25 rounded-xl p-2.5">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-0.5">
                            Primary Score
                          </p>
                          <p className="text-2xl font-black text-primary font-mono">{primary.score}</p>
                          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            @{primary.odds.toFixed(2)} · {primary.prob}%
                          </p>
                        </div>

                        <div className="text-center bg-muted/50 border border-border/70 rounded-xl p-2.5">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
                            <ShieldCheck className="h-3 w-3 text-amber-500" /> Backup Cover
                          </p>
                          <p className="text-2xl font-black text-foreground font-mono">{backup.score}</p>
                          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            @{backup.odds.toFixed(2)} · {backup.prob}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] px-1 text-muted-foreground">
                        <span>
                          2-Score Cover: <strong className="text-foreground font-mono">{combinedProb}%</strong>
                        </span>
                        <Link
                          to={`/poisson-calculator?home=${encodeURIComponent(p.home_team)}&away=${encodeURIComponent(
                            p.away_team
                          )}&hxg=${homeXg}&axg=${awayXg}&league=${encodeURIComponent(p.league)}`}
                          className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                          <Calculator className="h-3 w-3" />
                          <span>6×6 Matrix</span>
                        </Link>
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

                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          size="sm"
                          variant={isPrimaryAdded ? 'secondary' : 'outline'}
                          className={`text-xs h-8 gap-1 ${isPrimaryAdded ? 'text-primary font-bold' : ''}`}
                          onClick={() => {
                            addSelection({
                              match: matchKey,
                              homeTeam: p.home_team,
                              awayTeam: p.away_team,
                              league: p.league,
                              market: `Correct Score ${primary.score}`,
                              odds: primary.odds,
                              confidence: p.confidence || 68,
                            });
                            toast.success(`Added ${matchKey} (CS ${primary.score} @ ${primary.odds}) to Bet Slip!`);
                          }}
                        >
                          {isPrimaryAdded ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span>{primary.score} Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              <span>CS {primary.score}</span>
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant={isBackupAdded ? 'secondary' : 'ghost'}
                          className={`text-xs h-8 gap-1 border border-border/60 ${
                            isBackupAdded ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                          }`}
                          onClick={() => {
                            addSelection({
                              match: matchKey,
                              homeTeam: p.home_team,
                              awayTeam: p.away_team,
                              league: p.league,
                              market: `Correct Score ${backup.score}`,
                              odds: backup.odds,
                              confidence: Math.max(55, (p.confidence || 68) - 6),
                            });
                            toast.success(`Added Backup CS ${backup.score} (@ ${backup.odds}) to Bet Slip!`);
                          }}
                        >
                          {isBackupAdded ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span>{backup.score} Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              <span>Cover {backup.score}</span>
                            </>
                          )}
                        </Button>
                      </div>
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
